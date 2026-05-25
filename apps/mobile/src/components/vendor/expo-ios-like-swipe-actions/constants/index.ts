import type { IMail } from "@/typings/mail.interfaces";

const PROFILE_PICTURES = [
  require("@/assets/profile-pictures/gradient-1.jpg"),
  require("@/assets/profile-pictures/gradient-2.jpg"),
  require("@/assets/profile-pictures/gradient-3.jpg"),
  require("@/assets/profile-pictures/gradient-4.jpg"),
  require("@/assets/profile-pictures/gradient-5.jpg"),
  require("@/assets/profile-pictures/gradient-6.jpg"),
];

const INITIAL_MAIL: IMail[] = [
  {
    id: "1",
    from: "Liz Dizon",
    subject: "Growing up too fast!",
    preview:
      "Hi Ritesh 😊, As you can see, K really got a kick out of the bubbles! 🫧 It was such a joyful moment 💛 Can you believe how fast they’re growing up?",
    when: "9:41 AM",
    unread: true,
    avatar: PROFILE_PICTURES[0],
    attachment: true,
  },
  {
    id: "2",
    from: "Magico Martinez",
    subject: "Today's epic views",
    preview:
      "Hi Ritesh 👋, reporting back from another breathtaking day in the mountains! 🌄 The views were absolutely unreal 😍 Wish you were here to see it!",
    when: "8:02 AM",
    unread: true,
    avatar: PROFILE_PICTURES[1],
    attachment: true,
  },
  {
    id: "3",
    from: "Jasmine Garcia",
    subject: "Page-turners 📚✨",
    preview:
      "Hey Ritesh 😄, it was so nice hanging out today—I’ve really missed that! 💬 As promised, here are some amazing book recommendations 📖 Hope you enjoy them!",
    when: "Sunday",
    avatar: PROFILE_PICTURES[2],
  },
  {
    id: "4",
    from: "Jenny Court",
    subject: "Beach day vibes 🏖️🌊",
    preview:
      "Hey Ritesh 😎 Beach Day 🏖️ 💼 Chill vibes 🏐 Fun games 🍪 Delicious snacks 🌅 Stunning sunset—honestly such a perfect day!",
    when: "Friday",
    avatar: PROFILE_PICTURES[3],
    attachment: true,
  },
  {
    id: "5",
    from: "Orkun Kucuksevim",
    subject: "New hiking trail 🌲🥾",
    preview:
      "Hi Ritesh 👋, I found this amazing new trail our hikers' group should try! 🌿 It looks super scenic 🌄 Maybe we can meet early and explore together?",
    when: "Thursday",
    avatar: PROFILE_PICTURES[4],
  },
  {
    id: "6",
    from: "Sophie Turner",
    subject: "Weekend getaway ✨🌄",
    preview:
      "Hey Ritesh 👋, I was thinking it would be amazing to plan a little weekend getaway together! 🌿 Maybe somewhere peaceful with great views and cozy stays 😄 Let me know what you think!",
    when: "Wednesday",
    avatar: PROFILE_PICTURES[5],
  },
];

export { INITIAL_MAIL };
