import { Button, Dropdown, MenuProps } from "antd";
import React from "react";

export const ModelSelector = React.memo((props: {
    icon: React.ReactNode
    options: MenuProps['items']
}) => {
    const { icon, options } = props || {}


    return <Dropdown menu={{ items: options }} placement="topRight">
        <Button shape="circle" icon={icon} />
    </Dropdown>


    // <Select
    //     options={options}
    // />
})