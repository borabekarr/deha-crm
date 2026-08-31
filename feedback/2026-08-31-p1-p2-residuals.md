# Feedback: p1-p2-residuals
Source: Bora's pasted residual-debt review of p1 (picker, blur carousel) + p2 (adjust timeframe, task board, sprint planner, toast), 2026-08-31

- **F1** [picker — open]: "issue still persists. inner shell has error on openings." (original F6+F8 empty-open defect not resolved)
- **F2** [picker — close]: "the opened card's header is still there for 1 seconds still when the card closed, seeing on pill's inside."
- **F3** [picker — pill value styling]: "pill is not looking great. when value selected, the icon and text is so small. also text is not montserrat black. fit these into the pill view and make sure they have enough contrast and look great."
- **F4** [blur carousel — white theme bg]: "white theme background is grey. it should have been white. same background with the white theme ui."
- **F5** [blur carousel — blur edges]: "remove the left and right side sharp blur edges. they not looking great."
- **F6** [blur carousel — page fit]: "you should fit this component to the ui library page. it doesn't look great. we're gonna use this component in our crm, as embed into page. so make sure it looks like that."
- **F7** [adjust timeframe — right grip]: "right grip looks weird now. it should be on a bit right. it's on the inner side of the timeframe a bit. fix it. should look like left side."
- **F8** [adjust timeframe — arrows]: "left and right arrows is not routing to the lefts and rights." (when expanding/compacting the selected timeframe)
- **F9** [adjust timeframe — drag bugs]: "dragging bugs. re-arranging itself. stress test this."
- **F10** [adjust timeframe — outer corners]: "the outer shell's corners has color error. fix it."
- **F11** [task board — day pill row]: "the second week and right arrow has too much space between them. reference the left arrow and first week's first day pill spacing and adjust for right arrow - second week's last day pill. so you're gonna move second week to right. and then put the vertical separator exact between them."
- **F12** [task board + sprint planner — drag pickup glitch]: "when click and holding a card, it's being glitch a bit. like glowing for 0.1 seconds. it may be happening to the kanban's edges, I donno. this issue also happening on sprint planner core too."
- **F13** [task board — toasts]: "taskboard's toasts are not byte-identical with our 'toast' page components. fix it. colors are changing based on the card tag like 'urgent'."
- **F14** [sprint planner — toast colors]: "the toast colors should have been same with the card's priority tags like 'P0, P1, P2…'"
- **F15** [sprint planner — toast scroll]: "the toasts have scroll issues. when I scroll on the page, the toasts are moving up and bottom. fix it. their place is fixed there. no move based on scrolling."
- **F16** [toast — icon circle]: "across all toasts, the icon's outer glass round element's top right areas are extra. this round is not complete round and icon is not complete centered."
