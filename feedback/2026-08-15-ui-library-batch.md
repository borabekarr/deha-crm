# UI Library feedback batch — 2026-08-15 (raw, verbatim)

Source: Agentation feedback pass by Bora, viewport 1420×674. Split into 4 plans per /home/bora/.claude/plans/ui-library-fixes-crystalline-wilkes.md. Quotes below are verbatim for plan **Raw input:** fields.

## /components/inline-edit
- `.ie-field`/`.ie-act` (InlineEdit.tsx:12): "this "field" div's external lines should be clear. add a thin external line."

## /components/smooth-drawer
- `.sd-sheet` (SmoothDrawer.tsx:104): "we should fix the left and right drawer's inner section's corners. doesn't look right."

## Free-text
- "delete "drag dismiss sheet" component and it's page from our UI library"

## /components/adjust-timeframe
- `.tf-handle` (AdjustTimeframe.tsx:91): "the range input element with it's green arrengers should be aligned to right side of the ruler by default and I shouldn't be able to see grey sticks on it's right side. when the selected timeframe's right side shows "today". also, when I hold the green arranger and expand the selected timeframe through zoomed are's edges, you should arrange the zoomed frame. for example if I expand through left and it exceeds the zoomed frame, you should zoom out. so I should be able to see the selected timeframe element's all pixels included green arranger section."
- `.tf-head` fieldset: "we should add an calendar icon left side of the dates."

## /components/date-picker
- `#dp-confirm-btn` (use-squircle.ts:112): "this button's hover is broken. fix it. hover is terrible. use our regular button hover rules for apple"
- `.dp-outer` panel: "this card view's open and exit animations are not great. we should fix it. use apple's principles and make it great."

## /components/model-selector
- `.ms-shell` (ModelSelector.tsx:98): "this shell's closed view doesn't look right. outer shell is big on bottom side. fix it. also the inner white shell should not be that long. the inner shell's left side spacing between it's edge and icon should be same on the right side. last character - arrow icon and arrow icon - edge spacing."
- `.ms-shell`: "open and exit animations has bounce animation. remove it. we use apple standarts from now on."

## /components/status-card
- container (components.$slug.tsx:14): "we should not zoom in on hover. just apply a bit color darkening. also the card's rounds doesn't look right. fix it. these should look like pills."

## /components/delete-modal
- `.dm-shell` (DeleteModal.tsx:41): "this card's open and exit animations, overall design etc. is not great. this need much work. use apple rules. redesign. reanimate"

## /components/disclosure-group?v=3
- container: "make this "ledger" variation - options hover's view rounded corners. like pills. also I don't like green hover color. make it grey. a bit. like darkening a bit. also headers should be montserrat black. check our "display - montserrat" page. and bolden the icons."

## /components/delete-button?v=1
- container: "the state transitions should be faster. it's too slow right now. like button expanding, "deleted" state..."

## /components/shimmer
- `.sh-stage` (Shimmer.tsx:315): "shimmer effect - loaded context - shimmer effect should not be loop. make it button triggered. when context comes, it completes and stops."

## /components/blur-carousel
- `.nav-row` (BlurCarousel.tsx:112): "active row's pill's color is not clear. it's invisible. fix it."
- `#stage`: "this stage color is still dark. and I'm in the light mode right now. so this theme should be light. fix it."
- `#nextBtn`: "this button should always be green themed. until I came to the last carousel."

## Free-text — expandable-screen
- "when I visit the expandable screen page, I can't see the left pane of UI. and theme toggle, and agentation bubble. fix it. also, it's open and closing animations are not that smooth. when closing, the button's text is coming up too late. also, the expanded screen element's edges should not be that close to the browser's edges. there should be a bit proper spacing on each edge."

## Free-text — expandable-card
- "on expandable card page, "brisk" variation is better. fix mistakes tho. first one is, the entire page left including cards should not be resized. you should not change their places etc except I click on them. adjust the page based on that. and components. also the expanded card's cta button has hover issue. shorten it vertically. check our "buttons" page and take their sizes as an example."

## /components/message-dropdown?v=1  (MessageDropdown.tsx:521 / :61)
1. `.md-card`: "main version is the best overall look here."
2. `.md-tag` "New": "these should look like our colored pills. check our "pills, chips & badges" page - "event badges" section. usa same design for these "new"s."
3. `.md-trigger-badge` "3": "this should be bigger. a bit."
4. `.md-footer`: "these buttons are not great. check our "buttons" page, and take them as an example. the rounds, background etc needs job."
5. h3 "Messages": "add an icon beginning of it"
6. `.md-list`: "hover animation across options should be smoother."
7. `.md-card`: "the opened card's inner shell's external lines are broken a bit. fix it."
8. `.md-card`: "slow toggle is not working for that component. fix it."
9. `.md-outer`: "keep the button and opened card only. remove this additional card view. why you added our component inside of a big card?"
10. `.md-panel`: "light and dark themes is not matching for opened card view. fix it."
11. `.md-card`: "the exit animation on the opened card has some issues. the opened card's contexts like header etc. should exit more smooth. just revert the enter animation for exit animation and we should be fine."

## /components/toast?v=1  (Toast.tsx:246)
1. `.shell`: "the expandable toast is not expandable right now. use the "expandable card" s animations etc. exactly for that."
2. `.ts-root`: "the main variation is great. you can delete the others. the notification toast should always come on top. others should be on bottom always. you can delete recipes now. all toasts should be on right corner aligned. top right corner for notification, and bottom right corner for all other toasts. || also, when I hover to the toasts, if there's multiple, you should show them. each, seperately. the decks should open and their "timeout to disappear" should be frozen when I hovered on toast or hovering on that toast deck area."

## /components/picker?v=1  (Picker.tsx:327)
1. container: "open animation of this container is great but exit animation is not. just revert the enter animation for exit animation. for both pickers."
2. `.pk-tray`: "add a below and up side arrow buttons to redirection of the selection. I should be able switch the columns up and down without scrolling too. for both pickers."
3. `.label` "Date": "remove this. for both pickers."
4. `.badge` "event14 Aug": "remove this. for both pickers."
5. `.badge` "sellpicker / day-month": "remove this. for both pickers."
6. `.btn-primary` "todayToday": "make this button a regular themed and move it to the left. that green themed button should be "confirm" button. with it's icon, text... and when I click on that confirm button, you should save the picked day and close the card. and when I saved, the green themed "pick a day" button should not have the icon only. the button should show the picked day and month in it. so it will look like a pill. check our "pills, chips & badges" page's "event badges". it will look like them, but the similar size of current button. also it will be button still and I should be able to click again, change the day. If I don't click "confirm", you should not save the change."
7. `.pk-tray`: "add a vertical seperator line between day and month. the spacings between text and seperator line should be equal on both side."

## /components/buyer-brain?v=1  (BuyerBrain.tsx:428)
1. `.bbq-detail-card`: "the opening of that card should be fixed. not great. use apple rules. also the overall design does not look great too. beautify it. the entire card. and the grid view on top is too much small, grids. make them bigger a bit. like the "blur carousel" component's carousel's background."
2. `.bbq-panel`: "the brain pieces images are loading too slow. what's the issue about that here? we should fix it. almost immediate show-up required. maybe 3-5 seconds are exceptable but right now it's taking too long and we definitely should fix it. if it's gonna last 3-5 seconds even on the best optimized way, when we can show shimmer effect here until full image is uploaded. then we can show the entire content but until then, only shimmer. even no pills."
3. `.buyer-brain-root`: "you can remove other variants and keep the "main" only."

## /components/motion-tabs  (MotionTabs.tsx:138)
1. `.mt-dock`: "the closed view of this dock looks wrong. realignment issues about the active pill, and inner white section."
2. `.mt-panel`: "when I switch over the tabs, this section's change animation is not great. we should use apple's rules. also keep the direction aware change. figure out a fix for that."

## /components/avatar-picker  (AvatarPicker.tsx:64)
1. `.btn-green` "Get Started": "this button doesn't look great. the overall design, hover animation, icon, icon's animation... use apple's rules."
2. `.ap-header-row`: "increase the spacing between icon and header. proper spacing."
3. `.ap-strip-wrap`: "the hovered and selected ones' rounds are not ok. we should use complete round, like the top one. styles should match exactly. fix it."
4. `#ap-username`: "we should use the "inline edit" component here. directly copy - paste."

## /components/statistics-graph-card  (StatisticsGraphCard.tsx:230)
1. `.sg-card` lift: "the card lift is not great. check our "card primitives" page - inner card component's hover and apply same hover animation here."
2. `.sg-poplabel`: "text should be montserrat black. icon should be bolder."
3. `.sg-vlabel`: "let's remove this."

## /components/leaderboard  (Leaderboard.tsx:31)
1. container: "when I change the segment between "revenue" and "growth" both the pill's and the content's transitions is slow a bit. use apple's rules and fix this."
2. `.row` win: "set clear external lines for green rows. I can't see the external lines."
3. container: "the hover on options is not filling the option's inside entirely. I see thin blank area between grey hover and grey external lines. fix it"

## /components/index-bar  (use-proximity-group.ts:7)
1. `.idx-drawer`: "this green is not great. use the green pill's color for background. also add grid backgorund. texts should be white and has to has a shadow. and make them bolder a bit."

## /components/calendar  (use-squircle.ts:112)
1. `.cal-events`: "these events' hover effects are not great. check apple rules and fix these. pill shape grey hover color changes expected. no lift or zoom."
2. `.cal-ep-outer`: "overlap this popover on the calendar component. do not place inside of it. this is a popover."
3. `.cal-ep-outer`: "fix the corners of this popover's inside cards."

## /components/file-folder
1. `.ff-pop-body` (file-folder-hook.ts:61): "hover of these options is not great. check apple rules and fix this. only color change. darkening a bit with grey color. no lift or zoom in."
2. `.ff-text` (use-proximity-group.ts:7): "we should add a thin outer shell on these."

## /components/connect-modal  (ConnectModal.tsx:213)
1. `.cm-methods`: "hover and click animations should be fixed here. no bounce. apply apple rules."
2. `.cm-badges`: "these are too small. should be 100% bigger."
3. `#cm-sub`: "you can make that 1-2 lines."
4. `.cm-note`: "move this to a bit below."
5. `.cm-badge-rec`: "badge doesn't look ok. doesn't look great. you can minimize the icon and fit it to the text a bit maybe. and then make the badge smaller a bit."
6. `.cm-field`: "this field should be changed. copy our "inline edit" component and apply here by changing a bit based on the purpose here. paste should be there for example. and lock icon, and example text etc."
7. `.cm-close`: "this close button' current hovered view should be new default view. hovered view should make it darken a bit more. a bit greying. no lift up or zoom in."

## /components/workflow-add-elements  (WorkflowAddElements.tsx:569)
1. `.wae-pop-outer`: "this "nodes" popover should be aligned based on the option we have hovered on "add elements" popover. so that nodes popover should not be on the top all the time. for example if I hover below option, the nodes popover should align on below at the same ratio"
2. footer `.btn-green`: "this button is not great. check our "Ask Jeru" button on our "buttons" page. copy that button and add it here as it is, without changing."
3. seg `.active` "hubIntegrations": "integrations tab active pill arrangement is not ok. icon, text, and the pill's spacings looks odd. fix it."
4. `.wae-ae-list`: "the hover on those options and for all popover option hovers should be fixed. no lift or zoom in. only pill shaped grey color change."
5. `.wae-pop-outer`: "the exit animation of this "search results" popover is broken. just take it's enter animation, and revert it."
6. `.wae-search-cols`: "add progressive blur here. because this area is scrollable. also fix the top section because I can't see the top 2 box' top edge clearly."
7. nodes-header icon: "change the icon. search icon."
8. `.wae-nodes-header`: "text here should be montserrat black. check our "display - montserrat" page."
9. `.wae-search-cat-header`: "these top sections are not great. we should change this top section's theme with it's result's tag theme. for example, "output" box' top section should be green themed. bolder icon, bolder text, white text and shadow behind of it. grid background."
10. `.wae-ae-list`: "the transition of this context when I'm switching between pills is not looking great. apply apple rules for that. but I still want direction aware switch animation. figure it out."

## /components/workflow-nodes  (use-squircle.ts:112)
1. `.wf-hover-strip`: "the exit animation of that area is not great. the buttons are overlapping the default view of node. fix it. apply apple rules for hover expanding. and revert it then for exit animation. also the button's hovers are broken. for example, the rename button's tooltip is not appearing when I hover that button's middle and top. only on bottom. fix them. also gamify the buttons. they should look like the colorful tags. colorful and grid background, white icons, shadow behind of these icons."

## /components/workflow-publish  (WorkflowPublish.tsx:49)
1. `.wp-popover`: "hover of these options should be fixed. no lift up or zoom. only color change. grey. apply apple rules."
2. `.wp-popover`: "buttons are not great. both "update" and "publish". check our "buttons" page. beautify buttons."
3. `.wp-bezel`: "open and exit animations of this card is not great. fix it. apply apple rules."

## /components/workflow-template-cards  (use-squircle.ts:112 / WorkflowTemplateCards.tsx:470)
1. `.wtc-outer`: "fix these card's inner and outer shells."
2. `.wtc-grid`: "right side card's bottom side has an error. white section is there and it should not be. fix it"
3. `.wtc-node`: "these last node rounds are broken. fix these."
4. `.wtc-badge` "NEW": "this badge is broken. fix it."
5. `.wtc-use`: "beautify this button. add icon to the left side."

## /components/pills  (use-proximity-group.ts:7)
1. `.pills-row`: "these badges' grid background is not great. check the "event badges"s grid background and apply same for these."

## /components/task-board  (TaskBoard.tsx:771 / :1768)
1. `.tb-card`: "top cards on kanbans have shadow issue on top of them. it's cutting. fix it. apple standarts."
2. `.tb-filters`: "increase spacings between top days and these filters a bit. they so close."
3. `.tb-week`: "reduce the horizontal size of these pills. they are too large. cut unnecessary area on these pills. also add left and right arrows to route between week days. also when I click on those arrow, you should move to the next week's same selected day and show that day's taskboard context on below kanbans."
4. `.tb-card`: "when I hold the cards, you should not activate the card's already in kanban's glow animation. it's already there. we're only doing it for "new moved kanbans"."

## /components/sprint-planner-core  (use-proximity-group.ts:7)
1. `.sp-toast`: "these toasts should be replaced. check our "toast" page. apply same here. you can just duplicate. keep the "undo" button tho. also add that "toast with undo" version to the "toast" page too."

## /components/todo-list  (TodoList.tsx:14)
1. `.shell`: "the animations on that component is completely trash. lift ups, hovers, icon animations... remove all and start from beginning here. use find-animation skill of emil's and his other skills. also the task options need design, beautify."

## /components/theme-editor  (ThemeEditor.tsx:45)
1. `.te-swatches`: "remove these' appear animations."
2. `.te-row`: "remove this"
3. `.te-footer`: "we need to add a new button left side of the "save" button. that button will turn the settings into default. default text size, brightness, motion on. also, increase the spacing a bit between this section and top side section. they too close"
4. `.te-bg`: "remove gradient background here. keep component only"
5. `.te-header-text`: "this text is still black on dark mode."
6. `.te-preview`: "this area should be dark on dark mode. no white background"

## /components/morph-surface-feedback  (MorphSurface.tsx:12)
1. `.ms2-wrap`: "this component's open and exit animations are trash. bugs a lot. sharp corners, not smooth transitions... fix it"

## /components/onboarding-completion  (OnboardingCompletion.tsx:909)
1. `.oc-panel-wrap`: "fix this panel's card view on all versions. it's broken"
2. `.oc-seg`: "active pill is misaligned on all. fix it. for all versions"

## /components/dynamic-island-reader  (DynamicIslandReader.tsx:654)
1. `.di-check-pop`: "that done icon should exit immediately and 99% should come after that immediately if I scroll up. also the loading bar has some bug when I complete the article and scroll up. it's expanding through right and going back it's original. fix that bug"

## Free-text — split instruction
- "this should not be one big plan. seperate it. logically one or a few focused area plans."
