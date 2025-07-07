export default function generateWelcomeEmail(name, lastname) {
  return `
        <h3>Bonjour ${name} ${lastname},</h3>
        <p>Votre inscription a bien été prise en compte !</p>
        <p><strong>FÉLICITATIONS pour ton inscription 🎉.</strong></p>

        <p>
          Pour information, l'objectif de cette formation est d'apprendre à lire le Coran en arabe,
          de le mémoriser tout en appliquant les règles de tajwid pour la section coran.
        </p>

        <p>
          L'apprentissage de l'arabe littéraire, l'écrit et la grammaire grâce aux tomes de La Madrassah de Sheykh Ayoub pour la section arabe.
        </p>

        <p>
          Nous enseignons également à nos élèves certaines notions de science islamique afin de renforcer leurs acquis et de développer leurs connaissances religieuses.
        </p>

        <p>
          Pour cela, nous vous proposons une formation annuelle à raison d'une séance par semaine de 2h à 2h30 pour adultes, enfants et adolescents.
        </p>

        <p><strong>Baaraka Llahou fikoum</strong></p>

        <p>
          Vous serez recontacté(e) ultérieurement pour effectuer un test de niveau, ensuite vous intégrerez votre classe.
        </p>

        <p><strong>In sha Allah</strong></p>

        <p>
          <strong>QURANIYAH</strong><br />
          Vous trouverez tous nos réseaux sociaux ici ⬇️ <br />
          <a href="https://linktr.ee/quraniyah.fr" target="_blank">https://linktr.ee/quraniyah.fr</a>
        </p>
  `;
}
