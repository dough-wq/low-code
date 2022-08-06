import React, { useContext, useRef, useEffect, useReducer } from 'react';
import EditorContext from './context'
import './index.scss'

const Block = (props) => {
  // console.log(props);
   const [, forceUpdate] = useReducer(v => v + 1, 0)// 强制更新？
   const { config,} = useContext(EditorContext);
  const blockRef = useRef();
  const { block, ...otherProps } = props;

  
  const component = config.componentMap[block.type];
  const RenderComponent = component.render(block.props);

  useEffect(() => {

    // const { offsetWidth, offsetHeight } = blockRef.current;// 因为只向下取整，存在误差
    // 换成getBoundingClientRect 有六个参数  top,lef,right,bottom,width,height
    let { width, height } = blockRef.current.getBoundingClientRect();
    const offsetWidth = Math.ceil(width), offsetHeight = Math.ceil(height);
    const { style } = block;

    // block 初渲染至画布上时，记录一下尺寸大小，用于辅助线显示
    style.width = offsetWidth;
    style.height = offsetHeight;

    if (block.alignCenter) {
      style.left = style.left - offsetWidth / 2;
      style.top = style.top - offsetHeight / 2;
      block.alignCenter = false;
      forceUpdate();// 每次block改变，就强制更新Home组件
    }
  }, [block]);

  // --=============放大缩小===============---//
  const pointList = ['t', 'r', 'b', 'l', 'lt', 'rt', 'lb', 'rb'];
  const cursors = {
    t: 'n-resize',
    r: 'e-resize',
    b: 's-resize',
    l: 'w-resize',
    lt: 'nw-resize',
    rt: 'ne-resize',
    lb: 'sw-resize',
    rb: 'se-resize',
  }

  const getPointStyle = point => {
    const { width, height } = block;
    const hasT = /t/.test(point),
      hasB = /b/.test(point),
      hasL = /l/.test(point),
      hasR = /r/.test(point);
    let newLeft = 0, newTop = 0;

    // block 的四个角
    if (point.length === 2) {
      newLeft = hasL ? 0 : width;
      newTop = hasT ? 0 : height;
    } else {
      // 上下两点的点，宽度居中
      if (hasT || hasB) {
        newLeft = width / 2;
        newTop = hasT ? 0 : height;
      }
      // 左右两边的点，高度居中
      if (hasL || hasR) {
        newLeft = hasL ? 0 : width;
        newTop = Math.floor(height / 2);
      }
    }

    const style = {
      marginLeft: '-4px',
      marginTop: '-4px',
      left: `${newLeft}px`,
      top: `${newTop}px`,
      cursor: cursors[point],
    }

    return style;
  }

  const handleMouseDownOnPoint = (event, point) => {
    event.stopPropagation();
    const { clientX: startX, clientY: startY } = event;
    const { width, height, top, left } = block;

    const handleMouseMove = event => {
      let { clientX: moveX, clientY: moveY } = event;
      const diffX = moveX - startX;
      const diffY = moveY - startY;
      const hasT = /t/.test(point),
        hasB = /b/.test(point),
        hasL = /l/.test(point),
        hasR = /r/.test(point);
      const newHeight = height + (hasT ? -diffY : hasB ? diffY : 0);
      const newWidth = width + (hasL ? -diffX : hasR ? diffX : 0);
      block.height = Math.max(newHeight, 0);
      block.width = Math.max(newWidth, 0);
      block.left = left + (hasL ? diffX : 0);
      block.top = top + (hasT ? diffY : 0);
      forceUpdate();
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  const blockStyle = {
    top: block.style.top,
    left: block.style.left,
    // zIndex: block.style.zIndex,
    width: block.style.width,
    height: block.style.height,
    fontSize:block.style.fontSize,
    color:block.style.color
  };
  // debugger
  return (
    <div
      className={`editor-block ${block.focus ? 'editor-block-focus' : ''}`}
      style={blockStyle}
      ref={blockRef}
      {...otherProps}
    >
      {
        block.focus ? pointList.map((point) => (
          <div key={point} className="shape-point"
            onMouseDown={event => handleMouseDownOnPoint(event, point)}
            style={getPointStyle(point)}></div>
        )) : null
      }
      {RenderComponent}
    </div>
  )
}
export default Block