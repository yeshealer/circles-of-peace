import React, { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

/** Import internal components */
import { GroupDetails } from "./GroupDetails";

/** Import Context */
import { GlobalContext, ModalsContext } from "../contexts/GlobalContext";
import OfferCause from "./OfferCause";

/** Global component for the left navigation */
export function Navigation() {
  const { user, groups } = useContext(GlobalContext);
  const wrapperRef = useRef(null);

  /** Manage router */
  const router = useRouter();
  const { asPath } = useRouter();
  const { group_id, conversation_id } = router.query;

  return (
    <div className={"navigation-container"} ref={wrapperRef}>
      <div className={"causes-container"}>
        <div className={"causes-content"}>
          <img src="img/colorful-peace.png"></img>
         
         <OfferCause/>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Sustainable_Development_Goal_01NoPoverty.svg/300px-Sustainable_Development_Goal_01NoPoverty.svg.png"></img>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Sustainable_Development_Goal_02ZeroHunger.svg/220px-Sustainable_Development_Goal_02ZeroHunger.svg.png"></img>

          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Sustainable_Development_Goal_13.png/300px-Sustainable_Development_Goal_13.png"></img>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Sustainable_Development_Goal_5.png/300px-Sustainable_Development_Goal_5.png"></img>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Sustainable_Development_Goal_17Partnerships.svg/220px-Sustainable_Development_Goal_17Partnerships.svg.png"></img>
        </div>
      </div>

      {/** Show current group details */}
      <div className="navigation-level-2-container">
        <div className="navigation-level-2">
          <div className="item-group-label">GROUP DETAILS</div>
          <div className="group-menu">
            <GroupDetails />
          </div>
        </div>
      </div>
    </div>
  );
}
