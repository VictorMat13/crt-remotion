import React from "react";
import { Composition, Folder } from "remotion";
import { AcP1Hook, AC_P1_DURATION } from "./artcraft/AcP1Hook";
import { AcP2SameShortcuts, AC_P2_DURATION } from "./artcraft/AcP2SameShortcuts";
import { AcP3ThirtyYears, AC_P3_DURATION } from "./artcraft/AcP3ThirtyYears";
import { AcP4OpenSource, AC_P4_DURATION } from "./artcraft/AcP4OpenSource";
import { AcP5PayMonthly, AC_P5_DURATION } from "./artcraft/AcP5PayMonthly";
import { AcP6NoCode, AC_P6_DURATION } from "./artcraft/AcP6NoCode";
import { AcP7WhereHeading, AC_P7_DURATION } from "./artcraft/AcP7WhereHeading";
import { DrP1Hook, DR_P1_DURATION } from "./resolve/DrP1Hook";
import { DrP2Connect, DR_P2_DURATION } from "./resolve/DrP2Connect";
import { DrP3Highlight, DR_P3_DURATION } from "./resolve/DrP3Highlight";
import { DrP4Hours, DR_P4_DURATION } from "./resolve/DrP4Hours";
import { DrP5CanDo, DR_P5_DURATION } from "./resolve/DrP5CanDo";
import { DrP6Ceo, DR_P6_DURATION } from "./resolve/DrP6Ceo";
import { DrP7OffYourPlate, DR_P7_DURATION } from "./resolve/DrP7OffYourPlate";
import { MtP1Hook, MT_P1_DURATION } from "./motiontips/MtP1Hook";
import { MtP2Remotion, MT_P2_DURATION } from "./motiontips/MtP2Remotion";
import { MtP3LookDifferent, MT_P3_DURATION } from "./motiontips/MtP3LookDifferent";
import { MtP4Skill, MT_P4_DURATION } from "./motiontips/MtP4Skill";
import { MtP5Movement, MT_P5_DURATION } from "./motiontips/MtP5Movement";
import { MtP6Direction, MT_P6_DURATION } from "./motiontips/MtP6Direction";
import { MtP7References, MT_P7_DURATION } from "./motiontips/MtP7References";
import { MtP8MoreRefs, MT_P8_DURATION } from "./motiontips/MtP8MoreRefs";
import { PsTiltCrt, PS_TILT_DURATION } from "./random/PsTiltCrt";
import { PsMacro, PS_MACRO_DURATION } from "./random/PsMacro";

// Every graphic from the Oct 13 2026 CRT sprint. Folders mirror the reels.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="ArtCraft">
        <Composition id="AcP1Hook" component={AcP1Hook} durationInFrames={AC_P1_DURATION} fps={30} width={1080} height={960} />
        <Composition id="AcP2SameShortcuts" component={AcP2SameShortcuts} durationInFrames={AC_P2_DURATION} fps={30} width={1080} height={1920} />
        <Composition id="AcP3ThirtyYears" component={AcP3ThirtyYears} durationInFrames={AC_P3_DURATION} fps={30} width={1080} height={960} />
        <Composition id="AcP4OpenSource" component={AcP4OpenSource} durationInFrames={AC_P4_DURATION} fps={30} width={1080} height={1920} />
        <Composition id="AcP5PayMonthly" component={AcP5PayMonthly} durationInFrames={AC_P5_DURATION} fps={30} width={1080} height={960} />
        <Composition id="AcP6NoCode" component={AcP6NoCode} durationInFrames={AC_P6_DURATION} fps={30} width={1080} height={1920} />
        <Composition id="AcP7WhereHeading" component={AcP7WhereHeading} durationInFrames={AC_P7_DURATION} fps={30} width={1080} height={960} />
      </Folder>
      <Folder name="DaVinci-Resolve">
        <Composition id="DrP1Hook" component={DrP1Hook} durationInFrames={DR_P1_DURATION} fps={30} width={1080} height={960} />
        <Composition id="DrP2Connect" component={DrP2Connect} durationInFrames={DR_P2_DURATION} fps={30} width={1080} height={1920} />
        <Composition id="DrP3Highlight" component={DrP3Highlight} durationInFrames={DR_P3_DURATION} fps={30} width={1080} height={960} />
        <Composition id="DrP4Hours" component={DrP4Hours} durationInFrames={DR_P4_DURATION} fps={30} width={1080} height={1920} />
        <Composition id="DrP5CanDo" component={DrP5CanDo} durationInFrames={DR_P5_DURATION} fps={30} width={1080} height={960} />
        <Composition id="DrP6Ceo" component={DrP6Ceo} durationInFrames={DR_P6_DURATION} fps={30} width={1080} height={1920} />
        <Composition id="DrP7OffYourPlate" component={DrP7OffYourPlate} durationInFrames={DR_P7_DURATION} fps={30} width={1080} height={960} />
      </Folder>
      <Folder name="Motion-Tips">
        <Composition id="MtP1Hook" component={MtP1Hook} durationInFrames={MT_P1_DURATION} fps={30} width={1080} height={960} />
        <Composition id="MtP2Remotion" component={MtP2Remotion} durationInFrames={MT_P2_DURATION} fps={30} width={1080} height={1920} />
        <Composition id="MtP3LookDifferent" component={MtP3LookDifferent} durationInFrames={MT_P3_DURATION} fps={30} width={1080} height={960} />
        <Composition id="MtP4Skill" component={MtP4Skill} durationInFrames={MT_P4_DURATION} fps={30} width={1080} height={1920} />
        <Composition id="MtP5Movement" component={MtP5Movement} durationInFrames={MT_P5_DURATION} fps={30} width={1080} height={960} />
        <Composition id="MtP6Direction" component={MtP6Direction} durationInFrames={MT_P6_DURATION} fps={30} width={1080} height={1920} />
        <Composition id="MtP7References" component={MtP7References} durationInFrames={MT_P7_DURATION} fps={30} width={1080} height={960} />
        <Composition id="MtP8MoreRefs" component={MtP8MoreRefs} durationInFrames={MT_P8_DURATION} fps={30} width={1080} height={1920} />
      </Folder>
      <Folder name="Photoshop">
        {/* tilted Photoshop screen, slight CRT + handheld shake */}
        <Composition id="PsTiltCrt" component={PsTiltCrt} durationInFrames={PS_TILT_DURATION} fps={30} width={1080} height={1920} />
        {/* macro 3D-screen shots: shallow focus, live typing, cursor click, handheld */}
        <Composition id="PsMacro" component={PsMacro} durationInFrames={PS_MACRO_DURATION} fps={30} width={1080} height={1920} defaultProps={{ calib: false }} />
      </Folder>
    </>
  );
};
