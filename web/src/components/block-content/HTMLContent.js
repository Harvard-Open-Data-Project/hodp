import React from "react";
import { Text } from "theme-ui";

function HTMLContent(props) {
  return (
    <div>
      <br />
      {props.html && (
        <div
          dangerouslySetInnerHTML={{__html: props.html}}
          aria-label={props.alt}
        />
      )}
      <Text variant="caption">{props.caption}</Text>
      <br />
    </div>
  );
}

export default HTMLContent;