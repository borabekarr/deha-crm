import { StyleSheet } from "react-native";

const examplePopupStyles = StyleSheet.create({
  accordionBody: {
    gap: 8,
  },
  accordionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  accordionText: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipRow: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  itemText: {
    fontSize: 15,
  },
  popupPad: {
    gap: 2,
    minWidth: 240,
    padding: 8,
  },
  profilePopup: {
    minWidth: 300,
  },
  row: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchField: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchPopup: {
    minWidth: 300,
  },
  searchText: {
    fontSize: 14.5,
  },
});

export { examplePopupStyles };
