"use client";

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

export default function Home() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Laravel WebSocket サーバーへ接続
        const pusher = new Pusher('pusher-app-key', {
        cluster: 'mt1', // ダミー（Laravel WebSocketでは未使用だが必須）
        wsHost: 'localhost',
        wsPort: 6001,
        forceTLS: false,
        enabledTransports: ['ws'],
        });

        const channel = pusher.subscribe('public.hello');
        channel.bind('HelloWorld', function (data: any) {
        setMessage(data.message);
        });

        return () => {
        pusher.unsubscribe('public.hello');
        };
    }, []);

    return (
        <div>
        <h1>WebSocket Test</h1>
        <p>{message || '待機中...'}</p>
        </div>
    );
}