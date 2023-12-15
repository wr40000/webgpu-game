import './style.css'

class Renderer {
  private context!: GPUCanvasContext;
  private device!: GPUDevice;

  constructor() {

  }

  public async initializze(): Promise<void> {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;

    this.context = canvas.getContext('webgpu') as GPUCanvasContext;

    if (!this.context) {
      console.log('WebGPU not supported');
      alert("WebGPU not supported");
      return;
    }
    // 请求适配器 GPUAdapter接口提供对系统上可用GPU的访问
    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      console.error("No adapter found");
      alert("No adapter found");
      return;
    }

    // 从适配器请求设备 表示连接的物理设备
    this.device = await adapter.requestDevice();

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat()
    })    
  }

  public draw():void{
    // GPUCommandEncoder: 所有命令编码器的基本接口 用于创建命令缓冲区
    const commandEncoder = this.device.createCommandEncoder();
    // GPURenderPassDescriptor: 用于描述渲染过程 用于创建渲染过程编码器。
    const renderPassDescripter: GPURenderPassDescriptor = {
      // colorAttachments: WebGPU API的界面是一个颜色附件数组 用于描述渲染过程的颜色附件 用于创建渲染过程编码器
      colorAttachments:[{
        // 纹理将被清除为
        clearValue: {r:0.9, g:0.9, b:0.9, a:0.0},
        loadOp: 'clear', // 用于描述纹理将如何加载 clear:这种情况下表示正在清除纹理
        storeOp: 'store', // 描述纹理将如何存储
        // view: 用于描述纹理将被渲染到的哪
        view: this.context.getCurrentTexture().createView()
      }]
    }

    // 创建渲染过程编码器
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescripter);
    // 结束渲染过程编码器
    passEncoder.end();
    // submit用于向GPU提交命令缓冲区 commandEncoder.finish()用于创建命令缓冲区。
    this.device.queue.submit([commandEncoder.finish()]);
  }
}

let renderer = new Renderer()
renderer.initializze().then(()=>{renderer.draw()})