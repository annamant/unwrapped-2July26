(() => {
  const add = "vulkx.com\nw1radio.co\nwalkinbackrub.co.uk\nwandsworthoasis.org.uk\nwandsworthphysiotherapy.co.uk\nwanidaspa.com\nwantedmusic.co.uk\nwarhammer.com\nweareheartcore.com\nwelbooks.co.uk\nwenlinchineseschool.org.uk\nwestfield.com\nwestminsterphysio.co.uk\nwestminstertaekwondo.co.uk\nwheatsheafhall.org.uk\nwidget.treatwell.co.uk\nwillbjjteam.com\nwingchunlondon.co.uk\nwingtsun-london.com\nwustylebrixton.co.uk\nxen-do.com\nyemayalondonbeauty.com\nyogadebralondon.co.uk\nyogahaven.co.uk\nyogahealingtherapy.co.uk\nyogaloom.com\nyogamela.co.uk\nyogannie.co\nyogapoint.co.uk\nyogarise.london\nyogawithjuliet.co.uk\nyogawithseema.co.uk\nyogawithsusie.co.uk\nyoucanfight.co.uk\nzacandco.co.uk\nzenyoga.org.uk\nziadlondon.uk";
  const el = document.querySelector('textarea');
  const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
  const next = el.value + '\n' + add;
  proto.set.call(el, next);
  el.dispatchEvent(new Event('input', {bubbles:true}));
  return el.value.split('\n').filter(Boolean).length;
})()