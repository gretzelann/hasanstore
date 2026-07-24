type ChannelWithMembers = {
  name: string;
  type: string;
  members: { user: { id: string; name: string } }[];
};

/**
 * DM/group channels have no fixed name — the "other" participants change
 * depending on who's looking, so the label is computed per viewer rather
 * than read off the stored `channel.name`.
 */
export function displayName(channel: ChannelWithMembers, currentUserId: string): string {
  if (channel.type !== "dm" && channel.type !== "group") return channel.name;
  const others = channel.members.map((m) => m.user).filter((u) => u.id !== currentUserId);
  return others.length > 0 ? others.map((u) => u.name).join(", ") : "You";
}
