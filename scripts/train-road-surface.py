"""Train the two road-patch heads on RSCD, Mendeley version 3.

python scripts/train-road-surface.py DATASET.zip WORK_DIRECTORY OUTPUT.onnx
Requires PyTorch, NumPy, Pillow and ONNX. A folder containing blocks.json
and the selected images at their original archive paths also works.
"""
import hashlib
import json
from collections import defaultdict
from pathlib import Path, PurePosixPath
import random
import re
import sys
import zipfile


def sample_blocks(names):
    groups = defaultdict(lambda: defaultdict(list))
    for name in sorted(names):
        path = PurePosixPath(name)
        if len(path.parts) != 4 or path.parts[:2] != ('dataset', 'train-set'):
            continue
        label = path.parent.name
        if not re.fullmatch(r'(dry|wet|water)_(asphalt|concrete)_(smooth|slight|severe)', label):
            continue
        if not re.match(r'20\d{8}', path.name) or path.suffix.lower() != '.jpg':
            continue
        hour = path.name[:10]
        bucket = int(hashlib.sha256(hour.encode()).hexdigest()[:8], 16) % 10
        split = 'test' if bucket < 2 else 'valid' if bucket < 4 else 'train'
        groups[(label, split)][hour].append(name)
    blocks = []
    for (label, split), hours in sorted(groups.items()):
        rng = random.Random(label + '/' + split + '/robotcoach-1')
        keys = sorted(hours)
        rng.shuffle(keys)
        for hour in keys[:{'train': 40, 'valid': 4, 'test': 5}[split]]:
            paths = hours[hour]
            first = rng.randrange(max(1, len(paths) - 7))
            blocks.append({'split': split, 'hour': hour, 'label': label, 'paths': paths[first:first+8]})
    return blocks


def train(dataset, work, output):
    import numpy as np
    from PIL import Image
    import torch
    from torch import nn

    work.mkdir(parents=True, exist_ok=True)
    if dataset.is_file():
        with zipfile.ZipFile(dataset) as archive:
            blocks = sample_blocks(archive.namelist())
            for block in blocks:
                for name in block['paths']:
                    archive.extract(name, work)
        (work/'blocks.json').write_text(json.dumps(blocks), encoding='utf8')
        dataset = work
    else:
        blocks = json.loads((dataset/'blocks.json').read_text(encoding='utf8'))

    torch.manual_seed(2026)
    torch.set_num_threads(4)
    arrays = defaultdict(list)
    targets = defaultdict(list)
    for block in blocks:
        wet, _, rough = block['label'].split('_')
        labels = (['dry','wet','water'].index(wet), ['smooth','slight','severe'].index(rough))
        for name in block['paths']:
            with Image.open(dataset / name) as img:
                pixels = np.asarray(img.convert('RGB').resize((96,64), Image.Resampling.BILINEAR))
            arrays[block['split']].append(pixels)
            targets[block['split']].append(labels)
    inputs = {k: torch.from_numpy(np.stack(v)).permute(0,3,1,2).float() / 255 for k,v in arrays.items()}
    truth = {k: torch.tensor(v) for k,v in targets.items()}

    class TextureNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.stages = nn.ModuleList()
            for cin, cout in [(3,16), (16,24), (24,32)]:
                self.stages.append(nn.Sequential(nn.Conv2d(cin,cout,3,stride=2 if cin == 3 else 1,padding=1), nn.GroupNorm(4,cout), nn.ReLU(),
                    nn.Conv2d(cout,cout,3,padding=1), nn.GroupNorm(4,cout), nn.ReLU()))
            self.head = nn.Sequential(nn.Linear((3+16+24+32)*2,72), nn.ReLU(), nn.Dropout(.18), nn.Linear(72,6))

        def forward(self, x):
            features = []
            for stage in self.stages:
                features.extend((x.mean((2,3)), x.square().mean((2,3))))
                x = nn.functional.avg_pool2d(stage(x), 2)
            features.extend((x.mean((2,3)), x.square().mean((2,3))))
            p = self.head(torch.cat(features, dim=1))
            return p[:, :3], p[:, 3:]

    model = TextureNet()
    opt = torch.optim.AdamW(model.parameters(), lr=.001, weight_decay=.003)
    loss_fn = nn.CrossEntropyLoss(label_smoothing=.04)
    best_loss = float('inf')
    best = None
    for epoch in range(26):
        model.train()
        for ids in torch.randperm(len(inputs['train'])).split(64):
            x = inputs['train'][ids]
            if torch.rand(()) < .5:
                x = x.flip((3,))
            x = (x * (.90 + .20 * torch.rand(len(x),1,1,1))).clamp(0,1)
            outputs = model(x)
            loss = sum(loss_fn(v, truth['train'][ids,i]) for i,v in enumerate(outputs))
            opt.zero_grad()
            loss.backward()
            opt.step()
        model.eval()
        with torch.no_grad():
            v = [model(b) for b in inputs['valid'].split(64)]
            score = sum(loss_fn(torch.cat([p[i] for p in v]), truth['valid'][:,i]).item() for i in (0,1))
        if score < best_loss:
            best_loss = score
            best = {key: value.detach().clone() for key, value in model.state_dict().items()}
        if epoch == 15:
            for group in opt.param_groups:
                group['lr'] *= .35
        if epoch % 4 == 0:
            print('epoch', epoch+1, 'validation loss', round(score,3), flush=True)
    model.load_state_dict(best)
    model.eval()

    class Export(nn.Module):
        def forward(self, x):
            wet, rough = self.net(x)
            return wet.softmax(1), rough.softmax(1)
    export = Export()
    export.net = model
    export.eval()
    torch.onnx.export(export, inputs['test'][:1], str(output), opset_version=13,
                      input_names=['image'], output_names=['wet','rough'], dynamo=False)
    with torch.no_grad():
        predictions = [export(b) for b in inputs['test'].split(64)]
    stats = {'split': {k: len(v) for k,v in inputs.items()}, 'validation_loss': best_loss, 'test': {}}
    for i,(key,threshold) in enumerate([('wet',.58),('rough',.52)]):
        probs = torch.cat([p[i] for p in predictions])
        score, pred = probs.max(1)
        obs = truth['test'][:,i]
        covered = score >= threshold
        stats['test'][key] = {'confusion': torch.bincount(obs*3+pred,minlength=9).reshape(3,3).tolist(),
            'correct': int((pred == obs).sum()), 'answered': int(covered.sum()),
            'correct_answered': int(((pred == obs) & covered).sum())}
    print(json.dumps(stats), flush=True)
    (work/'surface-results.json').write_text(json.dumps(stats,indent=2),encoding='utf8')


if __name__ == '__main__':
    train(*(Path(arg).resolve() for arg in sys.argv[1:4]))
