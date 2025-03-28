import { UserOutlined } from '@ant-design/icons';
import { Bubble, Sender, useXAgent, useXChat, XRequest } from '@ant-design/x';
import { message as AntdMessage } from 'antd';
import React, { useState } from 'react';

const { create } = XRequest({
  // https://dashscope.aliyuncs.com/compatible-mode/v1
  // baseURL: '/compatible-mode/v1',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',

  // dangerouslyApiKey: process.env['API_KEY'], import.meta.env.API_KEY,
  dangerouslyApiKey: 'sk-448e34dbbec74ece8278f1298f31adb5',

  model: 'qwen-vl-plus',
});

const fooAvatar: React.CSSProperties = {
  color: '#f56a00',
  backgroundColor: '#fde3cf',
};

const barAvatar: React.CSSProperties = {
  color: '#fff',
  backgroundColor: '#87d068',
};

const hideAvatar: React.CSSProperties = {
  visibility: 'hidden',
};

const App: React.FC = () => {
  const [value, setValue] = useState<string>();
  const [outputingData, setOutputingData] = useState<boolean>(false);

  const [agent] = useXAgent({
    request: async (info, callbacks) => {
      const { messages, message } = info;
      const { onUpdate } = callbacks;

      // current message
      console.log('message', message);
      // messages list
      console.log('messages', messages);

      let content: string = '';

      try {
        create(
          {
            messages: [{ role: 'user', content: message }],
            stream: true,
          },
          {
            onSuccess: (chunks) => {
              console.log('sse chunk list', chunks);
              setOutputingData(false)
            },
            onError: (error) => {
              console.log('error', error);
            },
            onUpdate: (chunk) => {
              console.log('sse object', chunk);

              if (chunk.data !== ' [DONE]') {
                const data = JSON.parse(chunk.data);
                content += data?.choices[0].delta.content;
              }

              // const data = chunk.data === ' [DONE]' ? '' : JSON.parse(chunk.data);

              // content += data?.choices[0].delta.content;

              onUpdate(content);
            },
          },
        );
      } catch (error) {

        AntdMessage.error('输出错误: error')
      }
    },
  });

  const {
    // use to send message
    onRequest,
    // use to render messages
    messages,
  } = useXChat({ agent });

  console.log('list messages::', messages)

  const items = messages.map(({ message, id, status }) => ({
    // key is required, used to identify the message
    key: id,
    content: message,
    avatar: status === 'local' ? { icon: <UserOutlined />, style: barAvatar } : { icon: <UserOutlined />, style: fooAvatar },
    placement: status === 'local' ? 'end' : 'start'
  }));

  return (
    <div
      // className='app-container'
      style={{
        display: 'flex',
        flex: 1,
        width: '100vw',
        height: '100vh',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div
        style={{
          margin: 20,
          overflowY: 'auto',
          flexGrow: 1,
          maxHeight: 'calc(100vh - 100px)'
        }}>
        <Bubble.List items={items} />
      </div>
      <div
        style={{
          margin: 20,
          height: 60
        }}>
        <Sender
          placeholder='我是您的小帮手，请随意提问 :) '
          //  onSubmit={onRequest}
          loading={outputingData}
          value={value}
          onChange={(v) => {
            setValue(v);
          }}
          onSubmit={(str: string) => {
            onRequest(str)
            setValue('');
            setOutputingData(true);
            AntdMessage.info('Send message!');
          }}
        // onCancel={() => {
        //   setLoading(false);
        //   message.error('Cancel sending!');
        // }}
        />
      </div>
    </div>
  );
};

export default App
