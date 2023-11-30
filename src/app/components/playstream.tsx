'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SrsRtcPlayerAsync } from '../../../nextDontCompile/srs.sdk'; // Import the SrsRtcPublisherAsync module


const PlayStream = () => {
    const videoRef = useRef(null) as any;
    const toggleBtnRef = useRef(null) as any;
    const txtUrlRef = useRef(null) as any;
    const sessionIDRef = useRef(null) as any;
    const simulatorDropRef = useRef(null) as any;
    const [isMuted, setIsMuted] = useState(false) as any;
    let sdk: { close: any; stream: any; play: any; ontrack?: (event: any) => void; __internal?: { defaultPath: string; prepareUrl: (webrtcUrl: any) => { apiUrl: string; streamUrl: any; schema: any; urlObject: { url: any; schema: string; server: string; port: string; vhost: string; app: string; stream: string; }; port: string | number; tid: string; }; parse: (url: any) => { url: any; schema: string; server: string; port: string; vhost: string; app: string; stream: string; }; fill_query: (query_string: any, obj: any) => void; }; pc?: RTCPeerConnection; };

    const [isPiPMode, setIsPiPMode] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        const toggleBtn = toggleBtnRef.current;

        const togglePiPMode = async () => {
            toggleBtn.disabled = true;

            try {
                if (video !== document.pictureInPictureElement) {
                    await video.requestPictureInPicture();
                    setIsPiPMode(true);
                } else {
                    await document.exitPictureInPicture();
                    setIsPiPMode(false);
                }
            } catch (error) {
                console.log(error);
            } finally {
                toggleBtn.disabled = false;
            }
        };

        toggleBtn.addEventListener('click', togglePiPMode);

        return () => {
            // Cleanup: remove event listener when component unmounts
            toggleBtn.removeEventListener('click', togglePiPMode);
        };
    }, []);



    const startPlay = () => {
        videoRef.current.style.display = 'block';
        
        if (sdk) {
            sdk.close();
        }
        sdk = SrsRtcPlayerAsync();

        videoRef.current.srcObject = sdk.stream;

        const url = txtUrlRef.current.value;
        sdk.play(url)
            .then((session: { sessionid: any; simulator: any; }) => {
                sessionIDRef.current.innerHTML = session.sessionid;
                simulatorDropRef.current.href = `${session.simulator}?drop=1&username=${session.sessionid}`;
            })
            .catch((reason: any) => {
                sdk.close();
                videoRef.current.style.display = 'none';
                console.error(reason);
            });
    };

    useEffect(() => {
        sdk = SrsRtcPlayerAsync();
        startPlay();
    }, []);

    return (
        <div>
            <div className="container">
                <div className="form-inline">
                    URL:
                    <input type="text" ref={txtUrlRef} className="input-xxlarge" defaultValue={'webrtc://167.172.78.114:1985/live/REACTJS'} />
                    <button className="btn btn-primary" onClick={startPlay}>播放视频</button>
                </div>

                <label></label>
                <video id="rtc_media_player" ref={videoRef} controls autoPlay muted={isMuted}></video>

                <label></label>
                SessionID: <span ref={sessionIDRef}></span>
                <br />

                <label></label>
                Simulator: <a href='#' ref={simulatorDropRef}>Drop</a>
                <br />
                <br />
                <button id="PiP" ref={toggleBtnRef}>
                    {isPiPMode ? 'Exit Pip Mode' : 'Enable Pip Mode'}
                </button>
            </div>
        </div>
    );
};

export default PlayStream;
