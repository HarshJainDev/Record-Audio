import { useCallback, useEffect, useState } from "react";
import { useGoogleDrive } from "./useGoogleDrive";
import { useAudioRecording, PERMISSION_STATUS, COMPATIBILITY_STATUS, RECORDING_STATUS } from "./useAudioRecording";

function App() {
  const [compatibilityStatus, setCompatibilityStatus] = useState("");
  const [permissionStatus, setPermissionStatus] = useState("");
  const [recordingStatus, setRecordingStatus] = useState(RECORDING_STATUS.NONE);
  const [audio, setAudio] = useState("");

  const { uploadFile, isSignedIn, signIn, signOut, loadingScript } = useGoogleDrive();

  const onStop = useCallback(
    ({ audio, blob }) => {
      setAudio(audio);
      uploadFile(blob);
    },
    [uploadFile]
  );

  const onRecordingStatusChange = useCallback(({ status }) => {
    setRecordingStatus(status);
  }, []);

  const { checkCompatibility, requestPermission, startRecording, stopRecording, pauseRecording, resumeRecording } = useAudioRecording({
    onStop,
    onRecordingStatusChange,
  });

  useEffect(() => {
    const response = checkCompatibility();
    if (response === COMPATIBILITY_STATUS.AVAILABLE) {
      setCompatibilityStatus("HA hai compatible");
      requestPermission().then((status) => {
        switch (status) {
          case PERMISSION_STATUS.GRANTED: {
            setPermissionStatus("hai permission");
            break;
          }
          case PERMISSION_STATUS.DENIED: {
            setPermissionStatus("nahi hai permission");
            break;
          }

          case PERMISSION_STATUS.NEVER_ASK_AGAIN: {
            setPermissionStatus("mana kar hai permission ke liye");
            break;
          }

          default: {
            setPermissionStatus("path nahi kya hua");
          }
        }
      });
    } else {
      setCompatibilityStatus("NAHI hai compatible");
    }
  }, [checkCompatibility, requestPermission]);

  if (loadingScript) {
    return <div>loading...</div>;
  }

  return (
    <div>
      {isSignedIn && (
        <>
          {![RECORDING_STATUS.PAUSED, RECORDING_STATUS.RECORDING].includes(recordingStatus) && (
            <button type="button" onClick={startRecording}>
              START
            </button>
          )}
          {recordingStatus === RECORDING_STATUS.PAUSED && (
            <button type="button" onClick={resumeRecording}>
              RESUME
            </button>
          )}
          {recordingStatus !== RECORDING_STATUS.NONE && (
            <button type="button" onClick={stopRecording}>
              STOP
            </button>
          )}
          {recordingStatus === RECORDING_STATUS.RECORDING && (
            <button type="button" onClick={pauseRecording}>
              PAUSE
            </button>
          )}
          {recordingStatus === RECORDING_STATUS.RECORDING && (
            <button type="button" onClick={stopRecording}>
              RESET
            </button>
          )}
        </>
      )}
      {isSignedIn ? (
        <button id="signout_button" onClick={signOut}>
          Sign Out
        </button>
      ) : (
        <button id="authorize_button" onClick={signIn}>
          Authorize
        </button>
      )}
      <pre id="content"></pre>
      <div>compatibilityStatus::{compatibilityStatus}</div>
      <div>permissionStatus::{permissionStatus}</div>
      <div>recordingStatus::{recordingStatus}</div>
      <audio controls src={audio} />
    </div>
  );
}

export default App;
