"""Pack the verified GOOSE PP-LiteSeg ONNX export for the browser (ONNX 1.18)."""
import hashlib
from pathlib import Path
import sys

import onnx
from onnx import TensorProto, helper
from vision_onnx import quantize_conv_weights


def prepare(source, output):
    if hashlib.sha256(source.read_bytes()).hexdigest() != '627e56912e6cf2518159b138db13b0de8f8f466ef28543d0d0eb110190a056dc':
        raise ValueError('Expected the documented 64-class GOOSE ONNX checkpoint')
    model = onnx.load(source)
    graph = model.graph
    quantize_conv_weights(graph)
    graph.node.extend([
        helper.make_node('ArgMax',['logits'],['class_index'],axis=1,keepdims=0),
        helper.make_node('Cast',['class_index'],['labels'],to=TensorProto.UINT8),
    ])
    del graph.output[:]
    graph.output.append(helper.make_tensor_value_info('labels',TensorProto.UINT8,[1,512,512]))
    onnx.checker.check_model(model)
    onnx.save(model,output)


if __name__ == '__main__':
    prepare(*(Path(p) for p in sys.argv[1:3]))
