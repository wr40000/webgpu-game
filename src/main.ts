import './style.css'
import shaderSource from './shaders/shader.wgsl?raw'
import { QuadGeometry } from './geometry';
import { Texture } from './texture';
import { BufferUtil } from './buffer-util';
import { Camera } from "./camera";
import { Content } from './content';
import { Rect } from "./rect";
import { SpritePipeline } from "./sprite-pipeline";


class Renderer {
  private canvas!: HTMLCanvasElement;
  private context!: GPUCanvasContext;
  private device!: GPUDevice;
  private passEncoder!: GPURenderPassEncoder;

  private vertexData: Float32Array = new Float32Array(7 * 4);
  private indexBuffer!: GPUBuffer;
  private projectionViewMatrixBuffer!: GPUBuffer;

  private camera!: Camera;

  constructor() {

  }

  public async initializze(): Promise<void> {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;

    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;

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
    const geometry = new QuadGeometry();

    this.camera = new Camera(this.canvas.clientWidth, this.canvas.clientHeight)
    await Content.initialize(this.device);

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat()
    })

    this.indexBuffer = BufferUtil.createIndexBuffer(this.device, new Uint16Array(geometry.inidices), 'indexBuffer');
    this.projectionViewMatrixBuffer = BufferUtil.createUniformBuffer(this.device, new Float32Array(16), 'projectionViewMatrixBuffer')
  }

  public drawSprite(texture: Texture, rect: Rect) {
    const spritePipeline = SpritePipeline.create(this.device, texture, this.projectionViewMatrixBuffer);

    // top left 
    this.vertexData[0] = rect.x;
    this.vertexData[1] = rect.y;
    this.vertexData[2] = 0.0;
    this.vertexData[3] = 0.0;
    this.vertexData[4] = 1.0;
    this.vertexData[5] = 1.0;
    this.vertexData[6] = 1.0;

    // top right
    this.vertexData[7] = rect.x + rect.width;
    this.vertexData[8] = rect.y;
    this.vertexData[9] = 1.0;
    this.vertexData[10] = 0.0;
    this.vertexData[11] = 1.0;
    this.vertexData[12] = 1.0;
    this.vertexData[13] = 1.0;

    // bottom right
    this.vertexData[14] = rect.x + rect.width;
    this.vertexData[15] = rect.y + rect.height;
    this.vertexData[16] = 1.0;
    this.vertexData[17] = 1.0;
    this.vertexData[18] = 1.0;
    this.vertexData[19] = 1.0;
    this.vertexData[20] = 1.0;

    // bottom left
    this.vertexData[21] = rect.x;
    this.vertexData[22] = rect.y + rect.height;
    this.vertexData[23] = 0.0;
    this.vertexData[24] = 1.0;
    this.vertexData[25] = 1.0;
    this.vertexData[26] = 1.0;
    this.vertexData[27] = 1.0;

    const vertexBuffer = BufferUtil.createVertexBuffer(this.device, this.vertexData, 'vertexBuffer');


    this.device.queue.writeBuffer(
      this.projectionViewMatrixBuffer,
      0,
      this.camera.projectionViewMatrix as Float32Array);

    // DRAW HERE
    this.passEncoder.setPipeline(spritePipeline.pipeline);
    this.passEncoder.setIndexBuffer(this.indexBuffer, "uint16");
    this.passEncoder.setVertexBuffer(0, vertexBuffer);
    this.passEncoder.setBindGroup(0, spritePipeline.projectionViewBindGroup);
    this.passEncoder.setBindGroup(1, spritePipeline.textureBindGroup);
    this.passEncoder.drawIndexed(6); // draw 3 vertices
  }

  public draw(): void {
    this.camera.update()
    this.device.queue.writeBuffer(
      this.projectionViewMatrixBuffer,
      0,
      this.camera.projectionViewMatrix as Float32Array);
    // GPUCommandEncoder: 所有命令编码器的基本接口 用于创建命令缓冲区
    const commandEncoder = this.device.createCommandEncoder();
    // GPURenderPassDescriptor: 用于描述渲染过程 用于创建渲染过程编码器。
    const renderPassDescripter: GPURenderPassDescriptor = {
      // colorAttachments: WebGPU API的界面是一个颜色附件数组 用于描述渲染过程的颜色附件 用于创建渲染过程编码器
      colorAttachments: [{
        // 纹理将被清除为
        clearValue: { r: 0.9, g: 0.9, b: 0.9, a: 0.0 },
        loadOp: 'clear', // 用于描述纹理将如何加载 clear:这种情况下表示正在清除纹理
        storeOp: 'store', // 描述纹理将如何存储
        // view: 用于描述纹理将被渲染到的哪
        view: this.context.getCurrentTexture().createView()
      }]
    }

    // 创建渲染过程编码器
    this.passEncoder = commandEncoder.beginRenderPass(renderPassDescripter);

    for (let i = 0; i < 100; i++) {
      this.drawSprite(Content.playerTexture, new Rect(
        Math.random() * this.canvas.clientWidth,
        Math.random() * this.canvas.clientHeight,
        100, 100));
    }
    for (let i = 0; i < 50; i++) {
      this.drawSprite(Content.ufoRedTexture, new Rect(
        Math.random() * this.canvas.clientWidth,
        Math.random() * this.canvas.clientHeight,
        100, 100));
    }

    // 结束渲染过程编码器
    this.passEncoder.end();
    // submit用于向GPU提交命令缓冲区 commandEncoder.finish()用于创建命令缓冲区。
    this.device.queue.submit([commandEncoder.finish()]);

    // window.requestAnimationFrame(() => this.draw());
  }
}

let renderer = new Renderer()
renderer.initializze().then(() => { renderer.draw() })