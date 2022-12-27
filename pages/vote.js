import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";

import { RightSide } from "../components/RightSide";

/** Import Context */
import { GlobalContext } from "../contexts/GlobalContext";

/** Import Voting */
import { Voting } from "../components/Voting";

/** Global component for group details */
export default function GroupHome() {
  const { user, setUser, group_id, orbis } = useContext(GlobalContext);
  const [group, setGroup] = useState();

  useEffect(() => {
    loadGroupDetails();
  }, []);

  async function loadGroupDetails() {
    let { data, error } = await orbis.getGroup(group_id);

    if (data) {
      setGroup(data);
    }
  }

  /** Use Next router to get group_id */
  const router = useRouter();
  const { channel_id } = router.query;

  return (
    <>
      <div className="main-container">
        {/** Feed container */}
        <div className="main dashed-card">
          <div className="flex-column flex-1">
            {/** Show channel details */}
            <div className="channel-details flex-column v-justify-content-center mbottom-15">
              <div style={{ cursor: "pointer" }} onClick={() => router.back()}>
                Back
              </div>
              <p className="secondary m-0 mtop-8 express-yourself">
                Express yourself!
              </p>
            </div>

            {/** Show voting feed */}
            {group_id && <Voting />}
          </div>
        </div>

        {/** Right side */}
        <RightSide type="group-members" details={group_id} />
      </div>
    </>
  );
}
