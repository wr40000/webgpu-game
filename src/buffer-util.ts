export class BufferUtil {
    public static createVertexBuffer(device: GPUDevice, data: Float32Array, label: string): GPUBuffer {
        const buffer = device.createBuffer({
            label,
            size: data.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        })
        new Float32Array(buffer.getMappedRange()).set(data);
        buffer.unmap();
        return buffer
    }
    public static createIndexBuffer(device: GPUDevice, data: Uint16Array, label: string): GPUBuffer {
        const buffer = device.createBuffer({
            label,
            size: data.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX | GPUBufferUsage.INDEX,
            mappedAtCreation: true
        })
        new Uint16Array(buffer.getMappedRange()).set(data);
        buffer.unmap();
        return buffer
    }
    public static createUniformBuffer(device: GPUDevice, data: Float32Array, label: string): GPUBuffer {
        const buffer = device.createBuffer({
            label,
            size: data.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        return buffer;
    }

}