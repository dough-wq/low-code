const createEditorConfig = () => {
/* componentList: 存储了一个个物料组件的集合，用于渲染编辑器左侧物料的数据源；
componentMap: 是一个 map 映射关系，根据 type 字段进行映射，
有了它，就可以在画布中通过 Schema 数据去匹配物料组件来渲染画布视图。 */
  
  const componentList = []; // 自定义组件（物料）
  const componentMap = {}; // 组件和画布中元素的渲染映射

  return {
    componentList,
    componentMap,
    register: (component) => {
      componentList.push(component);
      componentMap[component.type] = component;
    }
  }
}

const registerConfig = createEditorConfig();

registerConfig.register({
  label: '文本',
  preview: () => '预览文本',
  render: ({ children }) => <span>{children}</span>,
  type: 'text',
  props: {
    children: '渲染文本',
  }
});

registerConfig.register({
  label: '按钮',
  preview: () => <button>预览按钮</button>,
  render: ({ children }) => <button style={{ display: 'block', width: '100%', height: '100%' }}>{children}</button>,
  type: 'button',
  props: {
    children: '渲染按钮',
  },
  style: {
    width: 100,
    height: 34,
    zIndex: 1,
  },
});

registerConfig.register({
  label: '输入框',
  preview: () => <input placeholder="预览输入框" />,
  render: ({children}) => <input placeholder="渲染输入框" value={children} />,
  type: 'input',
  props: {
    children: '渲染按钮',
  },
});

export default registerConfig;