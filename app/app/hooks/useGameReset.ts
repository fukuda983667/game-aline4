import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { resetGame } from '../store/gameStore';

export const useGameReset = (resetTrigger: number) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(resetGame());
    }, [resetTrigger, dispatch]);
};