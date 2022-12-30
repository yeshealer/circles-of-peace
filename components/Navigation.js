import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useRef } from "react";

import { NavLink, Space } from "@mantine/core";
import ClientOnly from "./ClientOnly";
import Cube from "./icons/Cube";

/** Import internal components */
import { GroupDetails } from "./GroupDetails";

/** Import Context */
import { ModalsContext } from "../contexts/GlobalContext";
import OfferCause from "./OfferCause";

import { Button } from "@mantine/core";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

/** Global component for the left navigation */
export function Navigation() {
  const { setModalVis } = useContext(ModalsContext);
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
            <Link href={"/"}>
              <img src="img/colorful-peace.png"></img>
            </Link>

            <Link href={"/vote"}>
              <img src="img/icons/question-mark.png" width={"62px"}></img>
            </Link>
            <div onClick={() => setModalVis("create-group", true)}>
              <img src="img/icons/plus-menu.png" width={"42px"}></img>
            </div>
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
          <div>
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
                    fullWidth
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
      </div>
    </ClientOnly>
  );
}
