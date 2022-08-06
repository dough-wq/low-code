import React, { useCallback, useReducer, useRef, useState } from 'react'
import clone from 'clone'
import Toolbar from '../../components/Toolbar'
import SchemaJSON from '../../schema/schema.json'
import config from '../config'
import Block from '../../components/Block'
import { Provider } from '../../components/Block/context'
import useCommands from '../../hooks/useCommands'
import events from '../../utils/EventEmitter'
import PropsSetter from '../../components/setter/PropsSetter'
import StyleSetter from '../../components/setter/StyleSetter'
import './index.scss'

export default function Home() {
  
  // const [schema, setSchema] = useState(JSON.parse(sessionStorage.getItem('lc-schema')) || SchemaJSON);
  const [schema, setSchema] = useState(SchemaJSON)
  const [wrapperDragState, setWrapperDragState] = useState({ 
    left: 0, 
    top: 0, 
    width: schema.container.width,
    height: schema.container.height,
  });
  const [activeSetter, setSetter] = useState('');

  const [, forceUpdate] = useReducer(v => v + 1, 0);// ⭐用以更新，测试下能用吗
  const { commands } = useCommands(schema, forceUpdate);
  console.log(events);

  const handleWrapperMouseDown = event => {
    // 避免进行右键操作后，出现意外画布移动。（event.button === 0 代表左键）
    if (event.button === 2) return;
    const { clientX: startX, clientY: startY } = event;
  
    const mousemove = event => {
      const diffX = event.clientX - startX;
      const diffY = event.clientY - startY;
      setWrapperDragState({
        ...wrapperDragState,
        left: wrapperDragState.left + diffX,
        top: wrapperDragState.top + diffY,
      });
    }
  
    const mouseup = () => {
      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
    }
  
    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', mouseup);
  }
  const changeCanvasSize = () => {
    schema.container.width = Number(wrapperDragState.width || 0);
    schema.container.height = Number(wrapperDragState.height || 0);
    forceUpdate();
  }
 
  

  const saveSchema = () => {
    sessionStorage.setItem('lc-schema', JSON.stringify(schema));
    alert('save success.');
  }
  // 临时查看
  const seeSchema = () => {
    alert(JSON.stringify(schema, null, 2));
  }
  // 顶部导航栏配置
  const buttons = [
    { label: '撤销', handler: commands.undo },
    { label: '重做', handler: commands.redo },
    { label: '保存', handler: saveSchema },
    { label: '删除', handler: commands.delete },
    { label: 'schema', handler: seeSchema },
  ];

  // 右侧属性配置
  const setterTabs = [
    { type: 'props', name: '属性' },
    { type: 'style', name: '样式' },
    // { type: 'events', name: '事件' },
    // { type: 'animations', name: '动画' },
  ]


  // 记录当前选中拖动的 block 索引
  const currentBlockIndex = useRef(-1);
  // 水平、垂直辅助线显示的位置
  const [markLine, setMarkLine] = useState({ x: null, y: null });

  // --============拖拽事件=============--//
  const currentMaterial = useRef();// 采用useRef保存拖拽组件
  const handleDragStart = (component) => {
    currentMaterial.current = component;
    events.emit('startDrag');
  }
  // console.log(events);
  const handleDragEnter = event => event.dataTransfer.dropEffect = 'move';

  const handeDragOver = event => event.preventDefault();

  const handleDragLeave = event => event.dataTransfer.dropEffect = 'none';

  // ⭐重要 当物料放到画布上时，我们保存数据到schema
  const handleDrop = event => {
    // const {type,props,style} = currentMaterial.currentBlockIndex
    const { offsetX, offsetY } = event.nativeEvent;
    // 1、取出注册组件时定义的 props
    const { type, props, style } = currentMaterial.current;
    schema.blocks.forEach(block => block.focus = false);
    schema.blocks.push({
      // type: currentMaterial.current.type,
      type,
      alignCenter: true,
      focus: true,
      style: {
        width: undefined,
        height: undefined,
        fontSize:14,
        left: offsetX,
        top: offsetY,
        color:'black',
        // zIndex: 1,
        ...style
      },
      // 2、传递给 block props
      props,
     
    });
    events.emit('endDrag');
    setSchema(clone(schema));
    currentMaterial.current = null;

    currentBlockIndex.current = schema.blocks.length - 1;
    setSetter('props');
  }

  // --==============获取焦点===========--//
  const blocksFocusInfo = useCallback(() => {
    let focus = [], unfocused = [];
    schema.blocks.forEach(block => (block.focus ? focus : unfocused).push(block));
    return { focus, unfocused };
  }, [schema]);

  const cleanBlocksFocus = (refresh) => {
    schema.blocks.forEach(block => block.focus = false);
    refresh && setSchema(clone(schema));
  }

  // --==========画布元素移动/拖动
  const dragState = useRef({
    startX: 0, // 移动前 x 轴位置
    startY: 0, // 移动前 y 轴位置
    startPos: [] // 移动前 所有 focus block 的位置存储
  });

  const handleBlockMove = (e) => {
    console.log(dragState);
    const { focus, unfocused } = blocksFocusInfo();
    const lastSelectBlock = schema.blocks[currentBlockIndex.current];
    // 我们声明：B 代表最近一个选中拖拽的元素，A 则是对应的参照物，对比两者的位置
    const { width: BWidth, height: BHeight, left: BLeft, top: BTop } = lastSelectBlock.style;

    // 1、记录鼠标拖动前的位置信息，以及所有选中元素的位置信息
    dragState.current = {
        // drag flag
    dragging: false,
      startX: e.clientX,
      startY: e.clientY,
      startPos: focus.map(({ style: { top, left } }) => ({ top, left })),

      // 用于实现 block 在画布上的辅助线
      startLeft: BLeft,
      startTop: BTop,

      // 找到其余 A block（unfocused）作为参照物时，参照物周围可能出现的 lines
      lines: (() => {
        const lines = { x: [], y: [] }; // 计算横线的位置使用 y 存放；纵线的位置使用 x 存放。

        [...unfocused, {
          // 画布中心辅助线
          style: {
            top: 0,
            left: 0,
            width: schema.container.width,
            height: schema.container.height,
          }
        }].forEach(block => {
          const { top: ATop, left: ALeft, width: AWidth, height: AHeight } = block.style;
          // liney.showTop: （水平位置）辅助线显示位置；
          // liney.top: 拖拽元素 top 显示位置；
          // linex.showLeft: （垂直位置）辅助线显示位置；
          // linex.left: 拖拽元素 left 显示位置。

          // 水平横线显示的 5 种情况：
          lines.y.push({ showTop: ATop, top: ATop }); // 情况一：A和B 顶和顶对其。拖拽元素和A元素top一致时，显示这跟辅助线，辅助线的位置时 ATop
          lines.y.push({ showTop: ATop, top: ATop - BHeight }); // 情况二：A和B 顶对底
          lines.y.push({ showTop: ATop + AHeight / 2, top: ATop + AHeight / 2 - BHeight / 2 }); // 情况三：A和B 中对中
          lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight }); // 情况四：A和B 底对顶
          lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight - BHeight }); // 情况四：A和B 底对底

          // 垂直纵线显示的 5 种情况：
          lines.x.push({ showLeft: ALeft, left: ALeft }); // A和B 左对左
          lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth }); // A和B 右对左
          lines.x.push({ showLeft: ALeft + AWidth / 2, left: ALeft + AWidth / 2 - BWidth / 2 }); // A和B 中对中
          lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth - BWidth }); // A和B 右对右
          lines.x.push({ showLeft: ALeft, left: ALeft - BWidth }); // A和B 左对右
        });

        // 假如画布上 unfocused 有两个，那么 lines.x 和 linex.y 分别存储了 10 条线位置信息
        return lines;
      })()
    }

    const blockMouseMove = (e) => {
      if (!dragState.current.dragging) {
        dragState.current.dragging = true;
        events.emit('startDrag'); // 记录开始拖拽移动
      }
      let { clientX: moveX, clientY: moveY } = e;

      // 辅助线
      // 计算鼠标拖动后，B block 最新的 left 和 top 值
      let left = moveX - dragState.current.startX + dragState.current.startLeft;
      let top = moveY - dragState.current.startY + dragState.current.startTop;
      let x = null, y = null;

      // 遍历x方向
      // 将当前 B block 移动的位置，和上面记录的 lines 进行一一比较，如果移动到的范围内有 A block 存在，显示对应的辅助线
      for (let i = 0; i < dragState.current.lines.x.length; i++) {
        const { left: l, showLeft: s } = dragState.current.lines.x[i];
        if (Math.abs(l - left) < 5) { // 接近 5 像素距离时显示辅助线
          x = s;
          // 实现吸附
          moveX = dragState.current.startX - dragState.current.startLeft + l;
          break;
        }
      }
      for (let i = 0; i < dragState.current.lines.y.length; i++) {
        const { top: t, showTop: s } = dragState.current.lines.y[i];
        if (Math.abs(t - top) < 5) { // 接近 5 像素距离时显示辅助线
          y = s;
          // 实现吸附
          moveY = dragState.current.startY - dragState.current.startTop + t;
          break;
        }
      }
      setMarkLine({ x, y });

      // 移动
      const durX = moveX - dragState.current.startX;//移动后为moveX，减去原始的
      const durY = moveY - dragState.current.startY;

      focus.forEach((block, index) => {
        block.style.top = dragState.current.startPos[index].top + durY;//更改用以修饰样式的数值
        block.style.left = dragState.current.startPos[index].left + durX;
      })

      setSchema(clone(schema));
      forceUpdate(); // ⭐测试下能用吗
    }

    const blockMouseUp = () => {
      document.removeEventListener('mousemove', blockMouseMove);
      document.removeEventListener('mouseup', blockMouseUp);
      setMarkLine({ x: null, y: null });
      if (dragState.current.dragging) {
        events.emit('endDrag');
      }
    }

    // 2、通过 document 监听移动事件，计算每次移动的新位置，去改变 focus block 的 top 和 left
    document.addEventListener('mousemove', blockMouseMove);
    document.addEventListener('mouseup', blockMouseUp);
  }


  const handleMouseDown = (e, block, index) => {
    e.preventDefault();// 阻止默认事件
    e.stopPropagation();// 防止调用相同事件的传播

    // 检测 SHIFT 键是否被按住。
    if (e.shiftKey) {
      const { focus } = blocksFocusInfo();
      // 当前只有一个被选中时，按住 shift 键不会切换 focus 状态
      block.focus = focus.length <= 1 ? true : !block.focus;
    } else {
      if (!block.focus) {
        cleanBlocksFocus();
        block.focus = true;
      }
    }
    setSchema(clone(schema));

    // 记录当前选中拖动的 block 索引；
    currentBlockIndex.current = index;

    // 进行移动
    handleBlockMove(e);
  }

  // 点击画布空白，取消选中
  const handleClickCanvas = event => {
    event.stopPropagation();
    currentBlockIndex.current = -1;
    cleanBlocksFocus(true);
  }

  return (
    <Provider value={{ config ,forceUpdate}}>
      <div className='editor-wrapper'>
        <header className='editor-header'>
          {buttons.map((button, index) => (
            <button key={index} className="editor-header-button" onClick={button.handler}>{button.label}</button>
          ))}
          {/* 自定义画布大小 */}
          <div className="editor-header-canvas">
            <span>画布尺寸</span>
            <input 
              value={wrapperDragState.width} 
              onChange={event => setWrapperDragState({ ...wrapperDragState, width: event.target.value })} 
              onBlur={changeCanvasSize} />
            <span>*</span>
            <input 
              value={wrapperDragState.height} 
              onChange={event => setWrapperDragState({ ...wrapperDragState, height: event.target.value })} 
              onBlur={changeCanvasSize} />
          </div>
        </header>
            {/* 内容区 */}
        <main className='editor-main'>
          <section className='editor-left'>
            {
              config.componentList.map(component => (
                <div draggable key={component.type}
                  className="editor-left-item"
                  onDragStart={() => handleDragStart(component)}
                >
                  <div className='list'>{component.label}</div>
                  {/* <div className='list'><span>{component.label}</span></div> */}
                  <div>{component.preview()}</div>
                  {/* <span>{component.label}</span> */}
                </div>
              ))
            }
          </section>

          <section className='editor-container'  onMouseDown={handleWrapperMouseDown}>
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handeDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onMouseDown={handleClickCanvas}
              id='canvas-container'
              style={{ ...schema.container, transform: `translate(${wrapperDragState.left}px, ${wrapperDragState.top}px)` }}
            // 这里定义了画布的大小，可以更改
            >
              {markLine.x !== null && <div className="editor-line-x" style={{ left: markLine.x }}></div>}
              {markLine.y !== null && <div className="editor-line-y" style={{ top: markLine.y }}></div>}
              {
                schema.blocks.map((block, index) => (
                  <Block key={index} block={block} onMouseDown={e => handleMouseDown(e, block, index)} />
                ))
              }
            </div>
          </section>

          <div className="editor-right">
            <div className="setter-tabs-list">
              {/* 1.渲染Tab */}
              {setterTabs.map(tab => (
                <div
                  key={tab.type}
                  data-type={tab.type}
                  className={`setter-tab ${activeSetter === tab.type ? 'setter-tab-active' : ''}`}
                  onClick={() => setSetter(tab.type)}>{tab.name}</div>
              ))}
            </div>
            {/* 2.渲染activeTab对应的View */}
            <div className="setter-content">
              {currentBlockIndex.current !== -1 ? (() => {
                const block = schema.blocks[currentBlockIndex.current];
                if (!block) return null;
                switch (activeSetter) {
                  case 'props':
                    return <PropsSetter block={block} />;
                  case 'style':
                    return <StyleSetter block={block} />
                  default:
                    return null;
                }
              })() : null}
            </div>
          </div>

        </main>

      </div>
    </Provider>
  )
}
