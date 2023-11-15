'use client'
import { useState, useRef, useEffect } from 'react'

export default function LiveStream () {
  
  const [devices, setDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState(null);
  
  const localVideoRef = useRef(null)

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      setSelectedVideoDevice(videoDevices[0]?.deviceId);
    });
  }, []);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedVideoDevice }, audio: true })
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing media devices: ', error)
    }
  }

  const stopStream = () => {
    const stream = localVideoRef.current.srcObject
    const tracks = stream.getTracks()
    tracks.forEach(track => track.stop())
    localVideoRef.current.srcObject = null
  }


  useEffect(() => {
    if (selectedVideoDevice) {
      navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedVideoDevice }, audio: true }).then(stream => {
        localVideoRef.current.srcObject = stream
      });
    }
  }, [selectedVideoDevice]);


  const handleDeviceChange = event => {
    setSelectedVideoDevice(event.target.value);
  };
  return (
    <div>
      {devices.length > 0 && (
        <select value={selectedVideoDevice} onChange={handleDeviceChange}>
          {devices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      )}

      <video ref={localVideoRef} autoPlay playsInline></video>
      <button onClick={startStream}>Start Stream</button>
      <button onClick={stopStream}>Stop Stream</button>
    </div>
  )
}
