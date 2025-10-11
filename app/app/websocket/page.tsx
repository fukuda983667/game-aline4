'use client'

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import React from 'react';

const PUSHER_KEY = '49d48050fbe3aad25b13';

export default function Test() {
    const [data, setData] = useState('');

    useEffect(() => {
        Pusher.logToConsole = true;
        const pusher = new Pusher(PUSHER_KEY, {
            cluster: 'ap3',
        });

        const channel = pusher.subscribe('hello');
        channel.bind('HelloWorld', (data: any) => {
            console.log('Received:', data);
            setData(data.message); // ← 修正
        });

        return () => {
            channel.unbind('HelloWorld');
            pusher.unsubscribe('hello');
        };
    }, []);

    return <h1>{data || 'No data'}</h1>;
}
