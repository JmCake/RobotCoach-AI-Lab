"""Pack the PaddleSeg PP-MobileSeg-Base ADE20K static export for the browser.

Convert the model.pdmodel and model.pdiparams from the official export_model.zip
with Paddle2ONNX 1.3.1 first. Pass the resulting ONNX and destination filenames
to this script. The browser supplies RGB in [0,1] to both scene models.
"""
from pathlib import Path
import sys

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper
from vision_onnx import quantize_conv_weights


def prepare(source, destination):
    original = onnx.load(source).graph
    # The official export takes an argmax of the decoder logits before its
    # mobile-specific unique-class loop. Retain the trained decoder itself.
    logits = next(node.input[0] for node in original.node if node.op_type == 'ArgMax')
    needed = {logits}
    retained = []
    for node in reversed(original.node):
        if needed.intersection(node.output):
            retained.append(node)
            needed.update(node.input)
    inputs = [helper.make_tensor_value_info('rgb', TensorProto.FLOAT, [1, 3, 512, 512])]
    mean = np.array([.485, .456, .406], dtype='float32').reshape(1, 3, 1, 1)
    std = np.array([.229, .224, .225], dtype='float32').reshape(1, 3, 1, 1)
    initializers = [numpy_helper.from_array(a, name) for name, a in [
        ('mean', mean), ('std', std), ('grid', np.array([1,150,128,128], dtype='int64')),
        ('byte_scale', np.array(255, dtype='float32')),
    ]]
    nodes = [
        helper.make_node('Sub', ['rgb', 'mean'], ['centered']),
        helper.make_node('Div', ['centered', 'std'], [original.input[0].name]),
    ]
    for node in reversed(retained):
        if node.op_type == 'Constant' and len(node.attribute) == 1 and node.attribute[0].name == 'value':
            tensor = onnx.TensorProto()
            tensor.CopyFrom(node.attribute[0].t)
            tensor.name = node.output[0]
            initializers.append(tensor)
        else:
            nodes.append(node)
    initializers.extend(t for t in original.initializer if t.name in needed)
    nodes.extend([
        helper.make_node('Resize', [logits,'','','grid'], ['scores'], mode='linear', coordinate_transformation_mode='half_pixel'),
        helper.make_node('ArgMax', ['scores'], ['indices'], axis=1, keepdims=0),
        helper.make_node('Cast', ['indices'], ['classes'], to=TensorProto.UINT8),
        helper.make_node('Softmax', ['scores'], ['probabilities'], axis=1),
        helper.make_node('ReduceMax', ['probabilities'], ['top_score'], axes=[1], keepdims=0),
        helper.make_node('Mul', ['top_score', 'byte_scale'], ['scaled']),
        helper.make_node('Round', ['scaled'], ['rounded']),
        helper.make_node('Cast', ['rounded'], ['confidence'], to=TensorProto.UINT8),
    ])
    outputs = [helper.make_tensor_value_info(n, TensorProto.UINT8, [1,128,128]) for n in ['classes','confidence']]
    graph = helper.make_graph(nodes, 'PP-MobileSeg-Base ADE20K', inputs, outputs, initializers)
    quantize_conv_weights(graph)
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid('',16)], ir_version=9)
    onnx.checker.check_model(model)
    onnx.save(model, destination)


if __name__ == '__main__':
    prepare(*(Path(p) for p in sys.argv[1:3]))
