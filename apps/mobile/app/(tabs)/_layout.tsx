import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function TabIcon(props: { icon: IconName; focused: boolean }) {
  const { icon, focused } = props;
  return (
    <MaterialCommunityIcons
      name={icon}
      size={22}
      color={focused ? "#0B3D91" : "#75879A"}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0B3D91",
        tabBarInactiveTintColor: "#75879A",
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: "#E3E8EF",
          backgroundColor: "#FAFCFF"
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600"
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon icon="view-dashboard-outline" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ focused }) => <TabIcon icon="signal" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ focused }) => <TabIcon icon="plus-circle-outline" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon icon="account-circle-outline" focused={focused} />
        }}
      />
    </Tabs>
  );
}
