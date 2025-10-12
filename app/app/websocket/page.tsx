'use client';

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import React from 'react';

export default function Test() {
    const [data, setData] = useState('');

    useEffect(() => {
        Pusher.logToConsole = true;

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY as string, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string
        });


        const channel = pusher.subscribe('hello');
        channel.bind('HelloWorld', (data: any) => {
            console.log('Received:', data);
            setData(data.message);
        });

        return () => {
            channel.unbind('HelloWorld');
            pusher.unsubscribe('hello');
        };
    }, []);

    return <h1>{data || 'No data'}</h1>;
}
