import { useTranslation } from "next-i18next";

import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";

function calcRunning(total, current) {
  return current.status === "running" ? total + 1 : total;
}

export default function Component({ service }) {
  const { t } = useTranslation();

  const { widget, nodeNames } = service;

  function doesNodeMatch(nodeName) {
    // if not specified, use all nodes. Otherwise validate node is in list
    return (!nodeNames || nodeNames === undefined ||
      nodeNames.split(",").filter(name => name === nodeName).length != 0)
  }

  const { data: clusterData, error: clusterError } = useWidgetAPI(widget, "cluster/resources");

  if (clusterError) {
    return <Container error={clusterError} />;
  }

  if (!clusterData || !clusterData.data) {
    return (
      <Container service={service}>
        <Block label="proxmox.vms" />
        <Block label="proxmox.lxc" />
        <Block label="proxmox.cpu" />
        <Block label="proxmox.ram" />
      </Container>
    );
  }

  const { data } = clusterData;
  const nodes = data.filter(item => item.type === "node" && doesNodeMatch(item.node)) || [{ node: "", cpu: 0.0, mem: 0, maxmem: 0 }];
  const vms = data.filter(item => item.type === "qemu" && doesNodeMatch(item.node)) || [];
  const lxc = data.filter(item => item.type === "lxc" && doesNodeMatch(item.node)) || [];

  const runningVMs = vms.reduce(calcRunning, 0);
  const runningLXC = lxc.reduce(calcRunning, 0);

  // Sum together all the nodes' stats
  const combinedNode = nodes.reduce((acc, curr) => { return { cpu: acc.cpu + curr.cpu, mem: acc.mem + curr.mem, maxmem: acc.maxmem + curr.maxmem } }, { cpu: 0.0, mem: 0, maxmem: 0 });
  combinedNode.cpu /= nodes.length; // make an average rather than a sum

  // console.log(nodes, combinedNode);
  return (
    <Container service={service}>
      <Block label="proxmox.vms" value={`${runningVMs} / ${vms.length}`} />
      <Block label="proxmox.lxc" value={`${runningLXC} / ${lxc.length}`} />
      <Block label="proxmox.cpu" value={t("common.percent", { value: (combinedNode.cpu * 100) })} />
      <Block label="proxmox.mem" value={t("common.percent", { value: ((combinedNode.mem / combinedNode.maxmem) * 100) })} />
    </Container>
  );
}
