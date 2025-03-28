import { UserOutlined } from '@ant-design/icons';
import { Bubble, Sender, useXAgent, useXChat, XRequest, } from '@ant-design/x';
import { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';
import { message as AntdMessage, Button, MenuProps } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Models } from './common/const';
import { ModelSelector } from './components/ModelSelector';
import { RequestFn, } from '@ant-design/x/es/use-x-agent';

type ModelType = keyof typeof Models;

const fooAvatar: React.CSSProperties = {
    color: '#f56a00',
    backgroundColor: '#fde3cf',
};

const barAvatar: React.CSSProperties = {
    color: '#fff',
    backgroundColor: '#87d068',
};

// const hideAvatar: React.CSSProperties = {
//   visibility: 'hidden',
// };

// const reqRef = { request_id: 0 }


// const messageHistory = {}

const App: React.FC = () => {
    const [value, setValue] = useState<string>();
    const [outputingData, setOutputingData] = useState<boolean>(false);

    const [currtModelKey, setCurrtModelKey] = useState<ModelType>('ds_v3');
    const [messagesArray, setMessagesArray] = useState<{
        role: string;
        content: string;
    }[]>([])
    const currentModelInfo = useMemo(() => (Models[currtModelKey]), [currtModelKey])

    const XRequestConfig = useMemo(() => ({
        // https://dashscope.aliyuncs.com/compatible-mode/v1
        // baseURL: '/compatible-mode/v1',
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',

        // dangerouslyApiKey: import.meta.env.API_KEY,
        dangerouslyApiKey: 'sk-448e34dbbec74ece8278f1298f31adb5',

        // model: 'qwen-vl-plus',
        model: currentModelInfo.model,
    }), [currentModelInfo])

    const { create } = XRequest(XRequestConfig);

    const XAgentRequest: RequestFn<string> = useCallback(async (info, callbacks) => {
        const { messages, message } = info;
        const { onUpdate } = callbacks;

        // current message
        console.info('========message=========', { model: currentModelInfo.model, message, messages, messagesArray });
        // messages list
        // console.log('messages', messages);

        let content: string = '';

        try {
            create(
                {
                    model: currentModelInfo.model,
                    messages: messagesArray.length === 0 ? [{ role: 'user', content: message }] : messagesArray,
                    stream: true,
                },
                {
                    onSuccess: (chunks) => {
                        console.info('成功, sse chunk list::', chunks);
                        setOutputingData(false)
                    },
                    onError: (error) => {
                        console.info('报错, error::', error);
                    },
                    onUpdate: (chunk) => {
                        // console.info('更新中, sse object::', chunk);
                        if (chunk.data !== ' [DONE]') {
                            const data = JSON.parse(chunk.data);
                            if (data?.choices[0].delta.content !== void 0 &&
                                data?.choices[0].delta.content !== null &&
                                data?.choices[0].delta.content !== '') {
                                content += data?.choices[0].delta.content;
                            }
                        }

                        // const data = chunk.data === ' [DONE]' ? '' : JSON.parse(chunk.data);

                        // content += data?.choices[0].delta.content;

                        onUpdate(content);
                    },
                },
            );
        } catch (error) {

            AntdMessage.error(`输出错误: ${error}`)
        }
    }, [create, currentModelInfo.model, messagesArray])

    // const myFetch = useCallback(
    //     (message?, requestId?) => {

    //         const myHeaders = new Headers();
    //         myHeaders.append("Authorization", "Bearer sk-448e34dbbec74ece8278f1298f31adb5");
    //         myHeaders.append("Content-Type", "application/json");
    //         myHeaders.append("X-DashScope-SSE", "enable");
    //         // myHeaders.append("Cookie", "acw_tc=d8c0db20-1df3-9d28-92fa-c9e71d3c855db33047d1f9da5c1574d4fd7e8669ec8d");

    //         const raw = JSON.stringify({
    //             model: currentModelInfo.model,
    //             input: {
    //                 messages: messagesArray.length === 0 ? [{ role: 'user', content: message }] : messagesArray
    //             },
    //             messages: messagesArray.length === 0 ? [{ role: 'user', content: message }] : messagesArray,
    //             // parameters: {
    //             //     result_format: "message",
    //             //     incremental_output: true,
    //             //     stream: true
    //             // }
    //             stream: true
    //         });

    //         const requestOptions = {
    //             method: "POST",
    //             headers: myHeaders,
    //             body: raw,
    //             //   redirect: "follow"
    //         };

    //         return fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", requestOptions)

    //         // return fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    //         //     method: 'POST',
    //         //     body: JSON.stringify({
    //         //         model: currentModelInfo.model,
    //         //         input: {
    //         //             messages: messagesArray.length === 0 ? [{ role: 'user', content: message }] : messagesArray,
    //         //         },
    //         //         parameters: {
    //         //             result_format: "message",
    //         //             incremental_output: true
    //         //         }
    //         //     }),
    //         //     headers: {
    //         //         'Authorization': 'Bearer sk-448e34dbbec74ece8278f1298f31adb5',
    //         //         'Content-Type': 'application/json',
    //         //         'X-DashScope-SSE': 'enable'
    //         //     }
    //         // });

    //         // return fetch('http://127.0.0.1:9990/public/ds', {
    //         //     method: 'POST',
    //         //     body: JSON.stringify({
    //         //         prompt: message,
    //         //         chat_session_id: requestId,
    //         //     }),
    //         //     headers: {
    //         //         'Content-Type': 'application/json'
    //         //     }
    //         // });

    //     }, [currentModelInfo.model, messagesArray]
    // )

    const [agent] = useXAgent({
        request: XAgentRequest,
        customParams: [currentModelInfo]
        // request: async (info, { onSuccess, onUpdate }) => {
        //     setValue('')
        //     console.log("info-----", info)
        //     const { messages, message } = info
        //     const response = await myFetch(message)

        //     let fullcontent = ''

        //     for await (const chunk of XStream({
        //         readableStream: response.body,
        //     })) {
        //         // fullcontent += chunk.data

        //         if (chunk.data !== ' [DONE]') {
        //             const data = JSON.parse(chunk.data);
        //             if (data?.choices[0].delta.content !== void 0 &&
        //                 data?.choices[0].delta.content !== null &&
        //                 data?.choices[0].delta.content !== '') {
        //                 fullcontent += data?.choices[0].delta.content;
        //             }
        //         }
        //         onUpdate(fullcontent);
        //         if (chunk.event == 'done') {
        //             onSuccess(fullcontent)
        //             setOutputingData(false)
        //             // messageHistory[reqRef.request_id] = [...messages, fullcontent]
        //         }

        //         console.log(chunk);
        //     }
        // },
    });

    const {
        // use to send message
        onRequest,
        // use to render messages
        messages,
        // setMessages
    } = useXChat({ agent });

    // console.log('list messages::', messages)

    const items: BubbleDataType[] = messages.map(({ message, id, status }) => ({
        // key is required, used to identify the message
        key: id,
        content: message,
        avatar: status === 'local' ? { icon: <UserOutlined />, style: barAvatar } : { icon: <UserOutlined />, style: fooAvatar },
        placement: status === 'local' ? 'end' : 'start',
        // loading: (index === messages?.length - 1 && status !== 'local') ? loading : false
        loading: message?.length === 0
    }));

    const handleClickModelOptions = useCallback((value: string) => {
        setCurrtModelKey(value as ModelType)
    }, [])

    const modelOptions: MenuProps['items'] = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = [] as { key: string, label: any }[]

        Object.entries(Models).forEach(([key, value]) => {
            res.push({
                key: key,
                label: <Button type='link'
                    onClick={() => handleClickModelOptions(key)}
                >
                    {value.title}
                </Button>,
            }
            )
        });

        return res
    }, [handleClickModelOptions])


    useEffect(() => {
        console.log(111, { XRequestConfig })
    }, [XRequestConfig])
    useEffect(() => {
        console.log(222, { currentModelInfo })
    }, [currentModelInfo])
    useEffect(() => {
        console.log('333, useXChat::', messages)
        const newMessages = messages.map(item => (
            {
                role: item.status === 'local' ? "user" : 'assistant',
                content: item.message
            }
        ))
        setMessagesArray(newMessages)
    }, [messages])

    // useEffect(() => {
    //     let newMessages = []

    //     reqRef.request_id = requestId
    //     console.log('消息历史', messageHistory)

    //     if (messageHistory[requestId] && messageHistory[requestId].length > 0) {
    //       for (let index = 0; index < messageHistory[requestId].length; index++) {
    //         const element = messageHistory[requestId][index];
    //         if ((index % 2) == 0) {
    //           newMessages.push({
    //             status: 'local',
    //             message: element
    //           })
    //         } else {
    //           newMessages.push({
    //             status: 'ai',
    //             message: element
    //           })
    //         }
    //       }
    //     }

    //     console.log('命中消息', newMessages)

    //     setMessages(newMessages)
    //   }, [setMessages])


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
                    prefix={<ModelSelector icon={currentModelInfo.icon} options={modelOptions} />}
                    placeholder='我是您的小帮手，请随意提问 :) '
                    //  onSubmit={onRequest}
                    loading={outputingData}
                    value={value}
                    onChange={(v) => {
                        setValue(v);
                    }}
                    onSubmit={(str: string) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onRequest(str as any)
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
