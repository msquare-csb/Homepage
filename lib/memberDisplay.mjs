export function formatMemberCardAffiliation(affiliation) {
  if (typeof affiliation !== "string") {
    return affiliation;
  }

  return affiliation.replace(
    /^School of Advanced Materials Science and Engineering, Sungkyunkwan University$/,
    "Advanced Materials Science and Engineering, Sungkyunkwan University"
  );
}

export function sortMembersBySectionOrder(memberList, sections, sourceMembers) {
  const sectionRankByCategory = new Map();
  sections.forEach((section, sectionIndex) => {
    section.keys.forEach((category) => {
      sectionRankByCategory.set(category, sectionIndex);
    });
  });

  const sourceRankByName = new Map(
    sourceMembers.map((member, sourceIndex) => [member.name, sourceIndex])
  );

  return memberList
    .map((member, originalIndex) => ({ member, originalIndex }))
    .sort((a, b) => {
      const aSectionRank = sectionRankByCategory.get(a.member.category) ?? sections.length;
      const bSectionRank = sectionRankByCategory.get(b.member.category) ?? sections.length;
      if (aSectionRank !== bSectionRank) {
        return aSectionRank - bSectionRank;
      }

      const aSourceRank = sourceRankByName.get(a.member.name) ?? Number.MAX_SAFE_INTEGER;
      const bSourceRank = sourceRankByName.get(b.member.name) ?? Number.MAX_SAFE_INTEGER;
      if (aSourceRank !== bSourceRank) {
        return aSourceRank - bSourceRank;
      }

      return a.originalIndex - b.originalIndex;
    })
    .map(({ member }) => member);
}
