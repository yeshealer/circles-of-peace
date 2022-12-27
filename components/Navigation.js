import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useRef } from "react";

import { NavLink, Space } from "@mantine/core";
import ClientOnly from "./ClientOnly";
import Cube from "./icons/Cube";

/** Import internal components */
import { GroupDetails } from "./GroupDetails";

/** Import Context */
import { GlobalContext } from "../contexts/GlobalContext";
import OfferCause from "./OfferCause";

import { Button } from "@mantine/core";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

/** Global component for the left navigation */
export function Navigation() {
  const { user, groups } = useContext(GlobalContext);
  const wrapperRef = useRef(null);
  const { address, isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect({
      connector: new InjectedConnector(),
    });
  const { disconnect } = useDisconnect();

  /** Manage router */
  const router = useRouter();
  const { asPath } = useRouter();
  const { group_id, conversation_id } = router.query;

  return (
    <ClientOnly>
      <div className={"navigation-container"} ref={wrapperRef}>
        <div className={"causes-container"}>
          <div className={"causes-content"}>
            <img src="img/colorful-peace.png"></img>

            <OfferCause />
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
            <div className="group-menu">
              <GroupDetails />
            </div>
          </div>

          {/* vocdoni voting */}
          <Space h="md" />
          <Link href={"/vote"}>
            <NavLink label="Vote" color="violet" icon={<Cube />} />
          </Link>
          <Space h="md" />
          {isConnected ? (
            <Button color="red" fullWidth onClick={() => disconnect()}>
              Disconnect
            </Button>
          ) : (
            <>
              {connectors.map((connector) => (
                <Button
                  color="gray"
                  disabled={!connector.ready}
                  key={connector.id}
                  onClick={() => connect({ connector })}
                >
                  {!isLoading && "Connect to " + connector.name}
                  {isLoading &&
                    pendingConnector?.id === connector.id &&
                    " (connecting)"}
                </Button>
              ))}
            </>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
