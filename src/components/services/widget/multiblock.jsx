import Block from "./block";

export default function MultiBlock({ service, children, separator = " " }) {

  let visibleChildren = children;
  const fields = service?.widget?.fields;
  const type = service?.widget?.type;
  if (fields && type) {
    visibleChildren = children.filter(child => fields.some(field => `${type}.${field}` === child?.props?.label));
  }

  // join visible children's values separated by spaces
  let combinedValue = visibleChildren.reduce((acc, curr) => (acc + separator + curr?.props?.value), "");

  // only return a Block if it has values to display
  if (combinedValue !== "")
    return (
      <Block label={visibleChildren[0]?.props.label} value={combinedValue} />
    );
}
