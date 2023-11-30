'use client'
import { useState, useRef, useEffect } from 'react'
import { SrsRtcPublisherAsync, SrsError } from '../../utils/srs.sdk'; // Import the SrsRtcPublisherAsync module
import { nanoid } from 'nanoid'
export default function LiveStream() {

  const [devices, setDevices] = useState([]) as any[];
  const [selectedVideoDevice, setSelectedVideoDevice] = useState(null) as any;

  const [sdk, setSdk] = useState(null) as any;
  const [url, setUrl] = useState(`webrtc://167.172.78.114/live/${nanoid(5)}?secret=a4413240dd2847d9b52688b0e2202145`) as any;
  const [sessionID, setSessionID] = useState('') as any;
  const [drop, setDrop] = useState('#') as any;
  const [acodecs, setAcodecs] = useState('') as any;
  const [vcodecs, setVcodecs] = useState('') as any;

  const localVideoRef = useRef(null) as any;
  const toggleBtnRef = useRef(null) as any;

  const [isPiPMode, setIsPiPMode] = useState(false);

  useEffect(() => {
    const video = localVideoRef.current;
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

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      setSelectedVideoDevice(videoDevices[0]?.deviceId);
    });
  }, []);

  function SrsRtcFormatSenders(senders: any[], kind: string) {
    var codecs: string[] = [];
    senders.forEach(function (sender: { getParameters: () => any; track: { kind: string; }; }) {
      var params = sender.getParameters();
      params && params.codecs && params.codecs.forEach(function (c: { mimeType: string; clockRate: string; channels: string; payloadType: string; }) {
        if (kind && sender.track.kind !== kind) {
          return;
        }

        if (c.mimeType.indexOf('/red') > 0 || c.mimeType.indexOf('/rtx') > 0 || c.mimeType.indexOf('/fec') > 0) {
          return;
        }

        var s = '';

        s += c.mimeType.replace('audio/', '').replace('video/', '');
        s += ', ' + c.clockRate + 'HZ';
        if (sender.track.kind === "audio") {
          s += ', channels: ' + c.channels;
        }
        s += ', pt: ' + c.payloadType;

        codecs.push(s);
      });
    });
    return codecs.join(", ");
  }

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedVideoDevice }, audio: true })
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        startPublish()
      }
    } catch (error) {
      console.error('Error accessing media devices: ', error)
    }
  }

  const stopStream = () => {
    const stream = localVideoRef.current.srcObject
    const tracks = stream.getTracks()
    tracks.forEach((track: { stop: () => any; }) => track.stop())
    localVideoRef.current.srcObject = null
    sdk.close();
    setSessionID(null)
    setDrop('#')
  }

  const startPublish = () => {
    if (sdk) {
      sdk.close();
    }

    const newSdk = SrsRtcPublisherAsync();

    newSdk.pc.onicegatheringstatechange = (event: any) => {
      if (newSdk.pc.iceGatheringState === 'complete') {
        setAcodecs(SrsRtcFormatSenders(newSdk.pc.getSenders(), 'audio'));
        setVcodecs(SrsRtcFormatSenders(newSdk.pc.getSenders(), 'video'));
      }
    };

    setSdk(newSdk);

    const newUrl = url;
    newSdk.publish(newUrl)
      .then(async (session: { sessionid: any; simulator: any; }) => {
        setSessionID(session.sessionid);
        setDrop(`${session.simulator}?drop=1&username=${session.sessionid}`)
      })
      .catch((reason: { name: string; message: any; }) => {
        if (reason instanceof SrsError) {
          if (reason.name === 'HttpsRequiredError') {
            alert(`WebRTC推流必须是HTTPS或者localhost：${reason.name} ${reason.message}`);
          } else {
            alert(`${reason.name} ${reason.message}`);
          }
        }

        if (reason instanceof DOMException) {
          if (reason.name === 'NotFoundError') {
            alert(`找不到麦克风和摄像头设备：getUserMedia ${reason.name} ${reason.message}`);
          } else if (reason.name === 'NotAllowedError') {
            alert(`你禁止了网页访问摄像头和麦克风：getUserMedia ${reason.name} ${reason.message}`);
          } else if (['AbortError', 'NotAllowedError', 'NotFoundError', 'NotReadableError', 'OverconstrainedError', 'SecurityError', 'TypeError'].includes(reason.name)) {
            alert(`getUserMedia ${reason.name} ${reason.message}`);
          }
        }

        newSdk.close();
        localVideoRef.current.srcObject = null
        setSessionID(null)
        setDrop(null)
        console.error(reason);
      });
  };
  useEffect(() => {
    if (selectedVideoDevice) {
      navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedVideoDevice }, audio: true }).then(stream => {
        localVideoRef.current.srcObject = stream
        startPublish()
      });
    }
  }, [selectedVideoDevice]);


  const handleDeviceChange = (event: { target: { value: any; }; }) => {
    setSelectedVideoDevice(event.target.value);
  };
  return (
    <div>
      {devices.length > 0 && (
        <select value={selectedVideoDevice} onChange={handleDeviceChange}>
          {devices.map((device: any) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      )}

      <video ref={localVideoRef} id="rtc_media_player" autoPlay playsInline></video>

      <div className="container pb-5">
        <div className="form-inline">
          URL:
          <input
            type="text"
            id="txt_url"
            className="input-xxlarge"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <label></label>
        SessionID: <span id="sessionid">{sessionID}</span>
        <br />
        <label></label>
        Audio: <span id="acodecs">{acodecs}</span>
        <br />
        Video: <span id="vcodecs">{vcodecs}</span>
        <br />
        <label></label>
        Simulator: <a href={drop} id='simulator-drop'>Drop</a>
        <br />
        <button id="PiP" ref={toggleBtnRef}>
          {isPiPMode ? 'Exit Pip Mode' : 'Enable Pip Mode'}
        </button>

      </div>

      <button onClick={startStream}>Start Stream</button>
      <button onClick={stopStream} className='pl-5'>Stop Stream</button>
    </div>
  )
}
