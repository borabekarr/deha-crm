import { ChipGroup } from "@/reacticx-components/animated-chip/Chip";
import { IHeaderFiltersProps } from "@/typings/ui.interfaces";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

const HeaderFilters: React.FC<IHeaderFiltersProps> = ({ onChange }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const chips = React.useMemo(
    () => [
      {
        label: "Primary",
        activeColor: "#4A96DE",
        inActiveBackgroundColor: "#E8E8ED",
        labelColor: "#FFFFFF",
        icon: () => (
          <Ionicons
            name="person"
            size={18}
            color={selectedIndex === 0 ? "#FFFFFF" : "#6F6F73"}
          />
        ),
      },
      {
        label: "Cart",
        activeColor: "#4A96DE",
        inActiveBackgroundColor: "#E8E8ED",
        labelColor: "#FFFFFF",
        icon: () => (
          <Ionicons
            name="cart"
            size={20}
            color={selectedIndex === 1 ? "#FFFFFF" : "#7B7B80"}
          />
        ),
      },
      {
        label: "Updates",
        activeColor: "#4A96DE",
        inActiveBackgroundColor: "#E8E8ED",
        labelColor: "#FFFFFF",
        icon: () => (
          <Ionicons
            name="chatbubble-ellipses"
            size={18}
            color={selectedIndex === 2 ? "#FFFFFF" : "#7B7B80"}
          />
        ),
      },
      {
        label: "Promos",
        activeColor: "#4A96DE",
        inActiveBackgroundColor: "#E8E8ED",
        labelColor: "#FFFFFF",
        icon: () => (
          <Ionicons
            name="megaphone"
            size={18}
            color={selectedIndex === 3 ? "#FFFFFF" : "#7B7B80"}
          />
        ),
      },
    ],
    [selectedIndex],
  );

  const handleChange = React.useCallback(
    (index: number) => {
      setSelectedIndex(index);
      onChange?.(index);
    },
    [onChange],
  );

  return (
    <View style={styles.container}>
      <ChipGroup
        chips={chips}
        selectedIndex={selectedIndex}
        onChange={handleChange}
        containerStyle={styles.group}
      />
    </View>
  );
};

HeaderFilters.displayName = "HeaderFilters";

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
  },
  group: {
    gap: 10,
  },
});

export { HeaderFilters };
export default HeaderFilters;
