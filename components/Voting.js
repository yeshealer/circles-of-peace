import { useRouter } from "next/router";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { GlobalContext } from "../contexts/GlobalContext";

import { Button, Flex } from "@mantine/core";
import { getAddressFromDid } from "@orbisclub/orbis-sdk/utils";
import { useAccount, useConnect, useDisconnect, useSigner } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import ClientOnly from "./ClientOnly";

import {
  Election,
  EnvOptions,
  PlainCensus,
  VocdoniSDKClient,
  Vote,
} from "@vocdoni/sdk";

export const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export function Voting() {
  const [vocdoniSDK, setVocdoniSDK] = useState();
  const [members, setMembers] = useState([]);
  const [lastElectionId, setLastElectionId] = useState();
  const [loading, setLoading] = useState(false);
  const { group_id, orbis } = useContext(GlobalContext);
  const wrapperRef = useRef(null);

  /** get members */
  useMemo(() => {
    console.log("🚀 ~ file: Voting.js:32 ~ useMemo ~ group_id", group_id);
    if (group_id) {
      loadMembers();
    }
  }, [group_id]);

  async function loadMembers() {
    let { data, error, status } = await orbis.getGroupMembers(group_id);

    if (data) {
      let censusAddresses = [];
      data.map((member) => {
        const { address } = getAddressFromDid(member.profile_details.did);
        censusAddresses.push(address);
      });
      setMembers(censusAddresses);
      console.log(
        "🚀 ~ file: Voting.js:33 ~ loadMembers ~ censusAddresses",
        censusAddresses
      );
    }
  }

  /** get voter */
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect({
      connector: new InjectedConnector(),
    });
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const setupVocdoni = async () => {
      if (signer) {
        const client = new VocdoniSDKClient({
          env: EnvOptions.DEV,
          wallet: signer,
        });
        const accountData = await client.createAccount();
        if (accountData.balance === 0) {
          await client.collectFaucetTokens();
        }

        setVocdoniSDK(client);
        console.log(
          "🚀 ~ file: Voting.js:45 ~ setupVocdoni ~ accountData",
          accountData
        );
      }
    };
    setupVocdoni();
  }, [signer]);

  // form to create census + add voters from orbis get joined
  const createCensus = async () => {
    const census = new PlainCensus();
    census.add(members);

    console.log("🚀 ~ file: Voting.js:85 ~ createCensus ~ census", census);

    return census;
  };

  const createElection = (census) => {
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 10);

    const election = Election.from({
      title: "Impact Next",
      description: "Peacemaker! If peace is a start, then what's next?",
      header: "https://source.unsplash.com/random",
      streamUri: "https://source.unsplash.com/random",
      endDate: endDate.getTime(),
      census,
      electionType: null,
    });

    election.addQuestion(
      "Impact Next",
      "What Sustainable Dev Goal would you prioritise?",
      [
        { title: "No Poverty", value: 0 },
        { title: "Zero Hunger", value: 1 },
        { title: "Good health and wellbeing", value: 2 },
        { title: "Quality Education", value: 3 },
        { title: "Gender Equality", value: 4 },
        { title: "Clean water and sanitation", value: 5 },
        { title: "Affordable and clean energy", value: 6 },
      ]
    );
    return election;
  };

  // vote button

  // faucet

  return (
    <ClientOnly>
      <div className={"navigation-container"} ref={wrapperRef}>
        <div>
          <p>Voting</p>
          {isConnected && (
            <>
              <p>Connected</p>
              <Flex
                mih={50}
                gap="xs"
                justify="center"
                align="start"
                direction="column"
                wrap="wrap"
              >
                <Button
                  fullWidth
                  loading={loading}
                  loaderPosition="center"
                  onClick={async () => {
                    try {
                      setLoading(true);

                      /** Create census with addresses */
                      const census = await createCensus();
                      /** Create election */
                      const election = await createElection(census);
                      
                      const electionId = await vocdoniSDK.createElection(
                        election
                      );
                      console.log(
                        "🚀 ~ file: Voting.js:149 ~ onClick={ ~ electionId",
                        electionId
                      );
                      setLastElectionId(electionId); // also set electionId @ component state.
                      vocdoniSDK.setElectionId(electionId);

                      // wait for block get confirmed
                      delay(14000);
                    } catch (error) {
                      console.error(error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Create Election
                </Button>
                <Button
                  fullWidth
                  loading={loading}
                  loaderPosition="center"
                  onClick={async () => {
                    try {
                      setLoading(true);
                        console.log("voting...")
                      vocdoniSDK.wallet = signer;
                      console.log(`setting electionId ( ${lastElectionId} ) to client @ voting..`);
                    vocdoniSDK.setElectionId(lastElectionId);
                      const vote = new Vote([0,1]);
                      console.log(`submitting vote ${vote}`);

                      const confirmationId = await vocdoniSDK.submitVote(vote);
                      
                      console.log(
                        "🚀 ~ file: Voting.js:149 ~ <ButtononClick={ ~ confirmationId",
                        confirmationId
                      );
                    } catch (error) {
                      console.log(error)
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Vote
                </Button>

                <Button
                  fullWidth
                  loading={loading}
                  loaderPosition="center"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      console.log("fetching voting process info..");
                      const info = await vocdoniSDK.fetchElection(lastElectionId);
                      console.log(info) // shows election information and metadata
                      
                    } catch (error) {
                      
                    }finally {
                      setLoading(false);

                    }
                    
                  }}
                >
                  Fetch results
                </Button>


                <Button fullWidth onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </Flex>
            </>
          )}

          {!isConnected &&
            connectors.map((connector) => (
              <Button
                disabled={!connector.ready}
                key={connector.id}
                onClick={() => connect({ connector })}
              >
                {connector.name}
                {isLoading &&
                  pendingConnector?.id === connector.id &&
                  " (connecting)"}
              </Button>
            ))}
        </div>
      </div>
    </ClientOnly>
  );
}
