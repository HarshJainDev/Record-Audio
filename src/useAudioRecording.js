import { useCallback, useRef } from "react";

//  MediaRecorder.requestData();

const COMPATIBILITY_STATUS = Object.freeze({
  NONE: "NONE",
  AVAILABLE: "AVAILABLE",
  NOT_AVAILABLE: "NOT_AVAILABLE",
});

const PERMISSION_STATUS = Object.freeze({
  NONE: "NONE",
  GRANTED: "GRANTED",
  DENIED: "DENIED",
  NEVER_ASK_AGAIN: "NEVER_ASK_AGAIN",
});

const RECORDING_STATUS = {
  NONE: "NONE",
  PAUSED: "PAUSED",
  RECORDING: "RECORDING",
};

const useAudioRecording = ({ onStart, onStop, onPause, onResume, onRecordingStatusChange }) => {
  const mediaRecorderRef = useRef();
  const compatibilityStatus = useRef(COMPATIBILITY_STATUS.NONE);
  const recordingStatusRef = useRef(RECORDING_STATUS.NONE);
  const permissionStatusRef = useRef(PERMISSION_STATUS.NONE);

  const chunks = useRef([]);

  const checkForErrors = () => {
    if (!mediaRecorderRef.current) {
      throw new Error("some unknown error occurrent");
    }

    if (permissionStatusRef.current === PERMISSION_STATUS.NEVER_ASK_AGAIN) {
      throw new Error("access permission denied permanently");
    }

    if (permissionStatusRef.current === PERMISSION_STATUS.NONE) {
      throw new Error("permission not requested");
    }

    if (permissionStatusRef.current === PERMISSION_STATUS.DENIED) {
      throw new Error("access permission denied");
    }
  };

  const onStartListener = useCallback(() => {
    recordingStatusRef.current = RECORDING_STATUS.RECORDING;
    onRecordingStatusChange({ status: recordingStatusRef.current });

    try {
      onStart && onStart();
    } catch (e) {}
  }, [onRecordingStatusChange, onStart]);

  const onResumeListener = useCallback(() => {
    recordingStatusRef.current = RECORDING_STATUS.RECORDING;
    onRecordingStatusChange({ status: recordingStatusRef.current });

    try {
      onResume && onResume();
    } catch (e) {}
  }, [onRecordingStatusChange, onResume]);

  const onStopListener = useCallback(() => {
    const blob = new Blob(chunks.current, { type: "audio/ogg; codecs=opus" });
    chunks.current = [];
    const audioURL = window.URL.createObjectURL(blob);

    recordingStatusRef.current = RECORDING_STATUS.NONE;
    onRecordingStatusChange({ status: recordingStatusRef.current });

    try {
      onStop && onStop({ audio: audioURL, blob });
    } catch (e) {}
  }, [onRecordingStatusChange, onStop]);

  const onPauseListener = useCallback(() => {
    recordingStatusRef.current = RECORDING_STATUS.PAUSED;
    onRecordingStatusChange({ status: recordingStatusRef.current });

    try {
      onPause && onPause();
    } catch (e) {}
  }, [onPause, onRecordingStatusChange]);

  const onDataAvailable = (event) => {
    chunks.current.push(event.data);
  };

  const attachListener = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.ondataavailable = onDataAvailable;
    mediaRecorderRef.current.onstart = onStartListener;
    mediaRecorderRef.current.onstop = onStopListener;
    mediaRecorderRef.current.onpause = onPauseListener;
    mediaRecorderRef.current.onresume = onResumeListener;
  }, [onPauseListener, onResumeListener, onStartListener, onStopListener]);

  const checkCompatibility = useCallback(() => {
    // to check
    if (window.navigator?.mediaDevices?.getUserMedia) {
      compatibilityStatus.current = COMPATIBILITY_STATUS.AVAILABLE;
      return COMPATIBILITY_STATUS.AVAILABLE;
    }
    compatibilityStatus.current = COMPATIBILITY_STATUS.NOT_AVAILABLE;
    return COMPATIBILITY_STATUS.NOT_AVAILABLE;
  }, []);

  const requestPermission = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (compatibilityStatus.current !== COMPATIBILITY_STATUS.AVAILABLE) {
        throw new Error("not compatible");
      }

      window.navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          permissionStatusRef.current = PERMISSION_STATUS.GRANTED;
          mediaRecorderRef.current = new MediaRecorder(stream);
          attachListener();
          resolve(PERMISSION_STATUS.GRANTED);
        })
        .catch((err) => {
          permissionStatusRef.current = PERMISSION_STATUS.DENIED;
          reject(PERMISSION_STATUS.DENIED);
        });
    });
  }, [attachListener]);

  const startRecording = () => {
    checkForErrors();

    if (recordingStatusRef.current === RECORDING_STATUS.PAUSED) {
      mediaRecorderRef.current.resume();
      return;
    }

    mediaRecorderRef.current.start(1000);
  };

  const stopRecording = () => {
    checkForErrors();

    mediaRecorderRef.current.stop();
  };

  const pauseRecording = () => {
    checkForErrors();

    mediaRecorderRef.current.pause();
  };

  const resumeRecording = () => {
    checkForErrors();

    mediaRecorderRef.current.resume();
  };

  return {
    checkCompatibility,
    requestPermission,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
};

export { useAudioRecording, PERMISSION_STATUS, COMPATIBILITY_STATUS, RECORDING_STATUS };
