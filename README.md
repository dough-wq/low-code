# 字节青训营项目
- ESLint代码格式化（编写规范）
- 引入scss `cnpm i --save sass`
- 清除浏览器默认样式 `npm i normalize.css --save`
- 安装router`npm i react-router-dom --save`

**思路分析**
参考react和vue两个版本，把代码通一遍，然后进行优化

（下次分享整个数据规范，根据数据去定页面）
1. 把画布的布局分别分成各个组件
标记：⭐现在先把config放置在page文件下，基本配置完之后，将其放置在components下

## 开发记录

- **布局**
schema用以描述编辑画布信息，拖拽的组件元素信息
```js
export default function Home() {
  const [schema, setSchema] = useState(SchemaJSON)
  console.log(schema);
  return (
    <div className='editor-wrapper'>
      <header className='editor-header'><Toolbar/></header>
      <main className='editor-main'>
        <section className='editor-left'>物料</section>
        <section className='editor-container'>
          <div className='canvas-container'>
            画布
          </div>
        </section>
        <section className='editor-right'>属性</section>
      </main>

    </div>
  )
}
```

- **自定义物料组件**
左侧物料组件
1. 把画布的布局分别分成各个组件
标记：⭐现在先把config放置在page文件下，基本配置完之后，将其放置在components下
一个List数组、一个map集合

- **将物料组件拖拽到画布**
1. draggable可拖动
2. 拖拽事件，向Schema追加数据
onDragStart事件，采用useRef 保存拖拽组件
onDrop事件，会将数据保存到schema中，然后我们就可以在画布区域把保存的数据渲染出来。

- **画布元素获取焦点**
1. 手续哎你获取所选中的元素blocksFocusInfo
2. 记录拖动前位置（clientX，Y）
3. 记录拖动中的位置，一直更新，（更新的是样式）
⭐存在问题：当点击画布中的元素时，样式添加后不显示

- **辅助线**
即参考线：两元素靠近时，给出上下或者居中参考线
1. 需要提供未被拖动元素的位置，每次拖动都要计算，focus和unfocused两个元素的位置进行比较。
2. handleMouseDown事件，记录所拖动元素的索引值，传给currentBlockIndex
3. 注意：offsetWidth 只能向下取整，换成 getBoundingClientRect 获取元素的准确尺寸，保留两位小数或者是向上取整。图片https://blog.csdn.net/gao_xu_520/article/details/80365799
4. 获取元素位置和未拖拽元素位置，blocksFocusInfo事件统计了有没有被选中

画布中心

5. 点击空白，取消选中`currentBlockIndex.current = -1;`
6. 拖动结束后，重置 markLine


- **吸附功能**
吸附：两元素靠近时，自动吸附


- **撤销、重做**
1. 自定义hooks函数，定义数据，用来存放各种操作
2. drag command 向state.queue队列中添加拖拽操作记录，
3. 
⭐存在问题：该功能无法实现，是不是数据没有加入到schema中
⭐文章小结以下部分的内容没有实现

- **放大缩小**
1. 添加圆点   ⭐圆点位置设置不对
2. 自定义画布尺寸，⭐未设置
3. 保存Schema；采用了sessionStorage做了临时存储


- **右侧属性设置**
1. 
2. 属性设置逻辑，



- **布局**

## 知识点补充
- useContext
跨越组件层级直接传递变量，实现数据共享。与useRedecer结合使用。
useContext：解决组件间传值的问题。
redux：统一管理应用状态。
🦈就是父传子的时候，采用useContext可以跨层级进行传数据

- **关于鼠标位置信息**
event.clientX：clientX 事件属性返回当事件被触发时鼠标指针相对于浏览器页面（或客户区）的水平坐标。
event.clientY：垂直坐标。
## 数据配置
