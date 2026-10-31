const months=['იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი','ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი'];
export function dateText(value,annual=false){const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||'');if(!match)return value||'თარიღი არ არის მითითებული';return `${Number(match[3])} ${months[Number(match[2])-1]}${annual?'':' '+match[1]}`;}
