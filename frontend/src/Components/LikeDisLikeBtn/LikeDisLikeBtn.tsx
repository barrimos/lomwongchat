import React, { ChangeEvent, useState } from 'react'
import Input from '../Input/Input'
import './dist/LikeDisLikeBtn.css'

const LikeDisLikeBtn = () => {
    const [currState, setCurrState] = useState<'up' | 'down' | 'neutral'>('neutral')

    const activateFeelsBtn = (e: ChangeEvent | React.MouseEvent | React.TouchEvent): void => {
        const newState: 'up' | 'down' | 'neutral' = (e.target as HTMLInputElement).value === '1' ? 'up' : 'down'
        if (newState === currState) {
            setCurrState('neutral')
        } else {
            setCurrState(newState)
        }
    }

    return (
        <>
            <div className='likeDisLikeWrapper'>
                <div className='likeBtnWrapper'>
                    <i className={`likeDislikeIcon up fa ${currState === 'neutral' ? 'fa-thumbs-o-up' : currState === 'up' ? 'fa-thumbs-up' : 'fa-thumbs-o-up'}`}></i>
                    <Input
                        type='radio'
                        name='likeDislike'
                        id=''
                        value='1'
                        className='LikeDislikeBtn'
                        onChange={activateFeelsBtn}
                        checked={currState === 'up'}
                        onClick={activateFeelsBtn}
                    />
                </div>
                <div className='dislikeBtnWrapper'>
                    <i className={`likeDislikeIcon down fa ${currState === 'neutral' ? 'fa-thumbs-o-down' : currState === 'up' ? 'fa-thumbs-o-down' : 'fa-thumbs-down'}`}></i>
                    <Input
                        type='radio'
                        name='likeDislike'
                        id=''
                        value='-1'
                        className='LikeDislikeBtn'
                        onChange={activateFeelsBtn}
                        checked={currState === 'down'}
                        onClick={activateFeelsBtn}
                    />
                </div>
            </div>
        </>
    )
}

export default LikeDisLikeBtn