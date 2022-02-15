import { useCallback, useEffect, useState } from "react";

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest/"];
const SCOPES = "https://www.googleapis.com/auth/drive";
const DRIVE_APIS = "https://apis.google.com/js/api.js";
const FOLDER_NAME = "AUDIO RECORDING";

export const useGoogleDrive = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const initClient = () => {
    window.gapi.client
      .init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      })
      .then(() => {
        window.gapi.auth2.getAuthInstance().isSignedIn.listen((status) => {
          setIsSignedIn(status);
        });

        setIsSignedIn(window.gapi.auth2.getAuthInstance().isSignedIn.get());
      })
      .catch((error) => {
        console.log("error::", error);
      });
  };

  const signIn = useCallback(() => {
    window.gapi.auth2.getAuthInstance().signIn();
  }, []);

  const signOut = () => {
    window.gapi.auth2.getAuthInstance().signOut();
  };

  const createFolder = useCallback(({ folderName }) => {
    return new Promise(async (resolve, reject) => {
      const listFilesResponse = await window.gapi.client.drive.files.list({ fields: "*" });
      const files = listFilesResponse.result.files;

      const targetFolder = files.find((file) => file.name === folderName);

      if (targetFolder) {
        resolve(targetFolder.id);
        return;
      }

      const request = window.gapi.client.drive.files.create({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      });

      request.execute((r) => {
        resolve(r.id);
      });
    });
  }, []);

  const uploadFile = useCallback(
    async (file) => {
      createFolder({ folderName: FOLDER_NAME }).then((folderId) => {
        const boundary = "-------314159265358979323846";
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        var reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onload = (e) => {
          var contentType = file.type || "application/octet-stream";
          var metadata = {
            title: `AUDIO-${Date.now()}`,
            mimeType: contentType,
            parents: [{ id: folderId }],
          };
          var base64Data = btoa(reader.result);
          var multipartRequestBody =
            delimiter +
            "Content-Type: application/json\r\n\r\n" +
            JSON.stringify(metadata) +
            delimiter +
            "Content-Type: " +
            contentType +
            "\r\n" +
            "Content-Transfer-Encoding: base64\r\n" +
            "\r\n" +
            base64Data +
            close_delim;

          var request = window.gapi.client.request({
            path: "/upload/drive/v2/files",
            method: "POST",
            params: {
              parents: [{ id: folderId }],
              uploadType: "multipart",
            },
            headers: {
              "Content-Type": 'multipart/mixed; boundary="' + boundary + '"',
            },
            body: multipartRequestBody,
          });
          request.execute(() => {
            alert("uploaded");
          });
        };
      });
    },
    [createFolder]
  );

  const loadScript = (script) => {
    return new Promise((resolve, reject) => {
      setLoadingScript(true);
      const scriptTag = document.createElement("script");
      scriptTag.src = script;
      scriptTag.addEventListener("load", function () {
        setLoadingScript(false);
        resolve();
      });
      scriptTag.addEventListener("error", function (e) {
        reject(e);
      });
      document.body.appendChild(scriptTag);
    });
  };

  useEffect(() => {
    loadScript(DRIVE_APIS).then(() => {
      window.gapi.load("client:auth2", initClient);
    });
  }, []);

  return { loadingScript, isSignedIn, signIn, signOut, createFolder, uploadFile };
};
