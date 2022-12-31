import React, { useState, useEffect, useRef, useContext } from "react";
import { useRouter } from "next/router";
import { sleep } from "./index";
import { resizeFile, base64ToFile } from "./index";
import { arweavePush } from "./arweave";

/** Import Context */
import { GlobalContext } from "../contexts/GlobalContext";

// receives a group object like this:
// {
//  content : {
//     name: "",
//     description: "",
//     pfp: ""
//  }
// }
export async function createGroup(content) {
  const { orbis } = useContext(GlobalContext);
  const [name, setName] = useState(group?.content?.name);
  const [description, setDescription] = useState(group?.content?.description);
  const [pfp, setPfp] = useState(group?.content?.pfp);
  const [pfpIsUploading, setPfpIsUploading] = useState(false);
  const [status, setStatus] = useState(0);
  const hiddenPfpInput = useRef(null);

  console.log("Enter createGroup()");
  if (!name) {
    alert("Group name is required.");
    return;
  }

  /** Show loading state */
  setStatus(1);

//   let content = { name: name, description: description, pfp: pfp };

  /** Share post on Ceramic */
  let res = await orbis.createGroup(content);
  console.log("Created group: ", res);

  /** Display final status according to answer from SDK */
  switch (res.status) {
    case 200:
      setStatus(2);

      /** If a valid callback is passed as a parameter we use it to update the state  */
      console.log("Enter callback in group");
      let _group = { ...group };
      _group.content = content;
      console.log("Set group to:", _group);

      break;
    case 300:
      setStatus(3);
      break;
    default:
      setStatus(3);
      break;
  }

  /** Wait for 2 seconds before resetting the state */
  await sleep(1000);

  /** Hide group creation modal */
}
