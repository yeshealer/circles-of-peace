import { useDisclosure, useCounter } from '@mantine/hooks';
import { Modal, Button, Group, Text, Badge } from '@mantine/core';

export default function OfferCause() {
  const [opened, { close, open }] = useDisclosure(false);
  const [count, { increment, decrement }] = useCounter(3, { min: 0 });

  const badges = Array(count)
    .fill(0)
    .map((_, index) => <Badge key={index}>Badge {index}</Badge>);

  return (
    <>
      <Modal opened={opened} onClose={close} size="auto" title="Impact next">
        <Text>Impact areas you recommend will be one of the options in the next voting</Text>

        <Group noWrap mt="lg">
          {badges}
        </Group>

        <Group mt="xl">
          <Button variant="outline" onClick={increment}>
            Add cause
          </Button>
          <Button variant="outline" onClick={decrement}>
            Remove cause
          </Button>
        </Group>
      </Modal>
      <Group position="center">
        <Button onClick={open} style={{background:"black", height: "62px"}}>
        <img src="img/icons/question-mark.png" width={"62px"}></img>

        </Button>
      </Group>
    </>
  );
}