export type CommitteeMember = {name: string | null; affiliation: string | null; email: string | null};

// Editing keys: soc = Advisory Committee; loc = Organizing Committee.
// Use null for any name, affiliation or email that has not yet been provided.
// Email addresses are shown on Contact; Home shows names and affiliations only.
export const committees: {soc: CommitteeMember[]; loc: CommitteeMember[]} = {
  soc: [
    {name: "Gregory J. Herczeg", affiliation: "PKU/KIAA", email: "gherczeg1@gmail.com"},
    {name: "Feng Long", affiliation: "PKU/KIAA", email: "long.feng@pku.edu.cn"},
    {name: "Dandan Xu", affiliation: "THU/DoA", email: "dandanxu@tsinghua.edu.cn"} 
  ],
  loc: [
    {name: "Han Wang", affiliation: "PKU/KIAA", email: "han.wang.kiaa@pku.edu.cn"},
    {name: "Suyeon Son", affiliation: "PKU/KIAA", email: "sonsuyeon@pku.edu.cn"},
    {name: "Anindya Saha", affiliation: "PKU/KIAA", email: "anindya@pku.edu.cn"},
    {name: "Ekta Sharma", affiliation: "PKU/KIAA", email: "sharmaekta@pku.edu.cn"},
    {name: "Jessica Doppel", affiliation: "THU/DoA", email: null},
    {name: "Fujia Li", affiliation: "THU/DoA", email: "lifujia@mail.tsinghua.edu.cn"},
    {name: "David Robinson", affiliation: "THU/DoA", email: "drobinson@mail.tsinghua.edu.cn"},
    {name: "Zhao Su", affiliation: "THU/DoA", email: "suzhao@mail.tsinghua.edu.cn"}
  ]
};

