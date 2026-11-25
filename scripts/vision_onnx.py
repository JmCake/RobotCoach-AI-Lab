"""Store convolution weights per output channel as int8 for ONNX Runtime Web."""
import numpy as np
from onnx import helper, numpy_helper


def quantize_conv_weights(graph):
    weights = {node.input[1] for node in graph.node if node.op_type == 'Conv'}
    decoders = []
    for param in list(graph.initializer):
        if param.name not in weights:
            continue
        name = param.name
        values = numpy_helper.to_array(param)
        axes = tuple(range(1, values.ndim))
        scale = np.maximum(np.max(np.abs(values), axis=axes) / 127, 1e-12).astype('float32')
        channel_scale = scale.reshape((-1,) + (1,) * len(axes))
        packed = np.rint(values / channel_scale).clip(-127, 127).astype('int8')
        graph.initializer.remove(param)
        zero = np.zeros(len(scale), dtype='int8')
        for data, suffix in [(packed, '_q'), (scale, '_scale'), (zero, '_zero')]:
            graph.initializer.append(numpy_helper.from_array(data, name + suffix))
        inputs = [name + '_q', name + '_scale', name + '_zero']
        decoders.append(helper.make_node('DequantizeLinear', inputs, [name], axis=0))
    nodes = list(graph.node)
    del graph.node[:]
    graph.node.extend(decoders + nodes)
