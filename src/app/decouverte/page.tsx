import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import HighlightCard from '@/components/decouverte/HighlightCard'
import MotCard from '@/components/decouverte/MotCard'
import DistanceBanner from '@/components/decouverte/DistanceBanner'

export default async function DecouvertePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">

        {/* Titre */}
        <div className="text-center space-y-2">
          <h1 className="font-fraunces text-3xl font-bold text-ink">
            Nos deux villes
          </h1>
          <p className="font-manrope text-ink-soft text-sm">
            Lisbonne et Tunis — deux rives, une seule famille
          </p>
        </div>

        {/* Bannière distance + horloges */}
        <DistanceBanner />

        {/* ───── LISBONNE ───── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl" role="img" aria-label="Drapeau portugais">🇵🇹</span>
            <div>
              <h2 className="font-fraunces text-xl font-bold text-ink">Lisbonne</h2>
              <p className="font-manrope text-xs text-ink-soft">La ville de Papa — au bord du Tage</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <HighlightCard
              emoji="🚋"
              titre="Le Tram 28"
              description="Le tram jaune légendaire qui serpente dans les ruelles d'Alfama. C'est l'âme de Lisbonne sur des rails."
              accent="azur"
            />
            <HighlightCard
              emoji="🎶"
              titre="Le Fado"
              description="La musique de l'âme portugaise. Mélancolique et belle à la fois, comme une lettre qu'on n'envoie pas."
              accent="azur"
            />
            <HighlightCard
              emoji="🥐"
              titre="Pastel de Nata"
              description="Une petite tarte à la crème saupoudrée de cannelle. Papa en mange un chaque matin en pensant à vous."
              accent="gold"
            />
            <HighlightCard
              emoji="🌊"
              titre="Le Tage"
              description="Le fleuve immense qui traverse Lisbonne avant de rejoindre l'Atlantique. Le matin, il brille comme de l'or."
              accent="azur"
            />
            <HighlightCard
              emoji="🏰"
              titre="Château de São Jorge"
              description="Un château mauresque sur la colline qui domine toute la ville. On y voit Lisbonne jusqu'à l'horizon."
              accent="olive"
            />
            <HighlightCard
              emoji="🌸"
              titre="Alfama"
              description="Le plus vieux quartier de Lisbonne, tout en ruelles, azulejos bleus et fleurs aux fenêtres."
              accent="azur"
            />
          </div>

          {/* Mot en portugais */}
          <MotCard
            langue="Portugais — pour vous deux"
            drapeau="🇵🇹"
            mot="Saudade"
            phonetique="sa-u-da-dji"
            traduction="Une nostalgie douce-amère d'une personne ou d'un lieu aimé"
            exemple="Papa a la saudade de vous chaque jour. C'est une tristesse belle, parce qu'elle vient de l'amour."
            couleurBg="bg-azur/10 border border-azur/20"
          />
        </section>

        {/* ───── TUNIS ───── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl" role="img" aria-label="Drapeau tunisien">🇹🇳</span>
            <div>
              <h2 className="font-fraunces text-xl font-bold text-ink">Tunis</h2>
              <p className="font-manrope text-xs text-ink-soft">La ville de Sandra et Sarah — au bord de la Méditerranée</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <HighlightCard
              emoji="🕌"
              titre="La Médina"
              description="Le cœur historique de Tunis, classé UNESCO. Des souks aux parfums d'épices, de jasmin et de cuir."
              accent="gold"
            />
            <HighlightCard
              emoji="🔵"
              titre="Sidi Bou Saïd"
              description="Un village tout blanc et bleu posé sur une falaise. Les bougainvilliers roses débordent des murs."
              accent="azur"
            />
            <HighlightCard
              emoji="🌿"
              titre="Le Jasmin"
              description="Le parfum de Tunis. Les vendeurs ambulants tressent des bracelets de jasmin frais dans les rues."
              accent="olive"
            />
            <HighlightCard
              emoji="🏛️"
              titre="Carthage"
              description="L'une des plus grandes civilisations antiques — ses ruines regardent encore la mer. L'histoire dort sous vos pieds."
              accent="terracotta"
            />
            <HighlightCard
              emoji="🍲"
              titre="Le Couscous"
              description="Le plat du vendredi en famille. La recette de Tata est la meilleure du monde — c'est officiel."
              accent="gold"
            />
            <HighlightCard
              emoji="☀️"
              titre="La Méditerranée"
              description="La même mer que Lisbonne ! Papa et vous partagez la même mer bleue, juste de côtés différents."
              accent="azur"
            />
          </div>

          {/* Mot en arabe */}
          <MotCard
            langue="Arabe — pour Papa"
            drapeau="🇹🇳"
            mot="حبيبتي"
            phonetique="habibti"
            traduction="Ma chérie / Mon amour"
            exemple="C'est le mot que Papa ne se lasse jamais de dire. Habibti Sandra. Habibti Sarah. Chaque jour."
            couleurBg="bg-terracotta/10 border border-terracotta/20"
          />
        </section>

        {/* ───── Le saviez-vous ───── */}
        <section>
          <h2 className="font-fraunces text-xl font-bold text-ink mb-4">Le saviez-vous ?</h2>
          <div className="space-y-3">
            <div className="bg-jasmine rounded-2xl p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">💡</span>
              <p className="font-manrope text-sm text-ink leading-relaxed">
                <strong>Lisbonne et Tunis ont été fondées à des époques proches.</strong> Tunis est l'une des plus vieilles villes du monde (~3 000 ans). Lisbonne a été fondée par les Phéniciens (~1 200 av. J.-C.). Vous avez des racines dans deux civilisations millénaires !
              </p>
            </div>
            <div className="bg-jasmine rounded-2xl p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">🌊</span>
              <p className="font-manrope text-sm text-ink leading-relaxed">
                <strong>La même mer vous relie.</strong> Si vous mettiez un bateau à la mer depuis Tunis et que vous navigiiez vers l'ouest, vous arriveriez au Portugal. La Méditerranée puis l'Atlantique — mais la même eau salée.
              </p>
            </div>
            <div className="bg-jasmine rounded-2xl p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">🎨</span>
              <p className="font-manrope text-sm text-ink leading-relaxed">
                <strong>Les azulejos portugais et les zelliges tunisiens.</strong> Les carreaux colorés de Lisbonne (bleus et blancs) et les mosaïques de la Médina de Tunis viennent de la même tradition artistique maure. Votre famille unit deux arts frères.
              </p>
            </div>
            <div className="bg-jasmine rounded-2xl p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">☕</span>
              <p className="font-manrope text-sm text-ink leading-relaxed">
                <strong>Le café, passion commune.</strong> À Lisbonne on sirote un "bica" (expresso serré) debout au comptoir. À Tunis on prend un "qahwa" à la menthe dans un café de la Médina. Deux rituels, même amour du café.
              </p>
            </div>
          </div>
        </section>

        {/* Message de Papa */}
        <div className="bg-terracotta rounded-3xl p-6 text-center space-y-3">
          <p className="font-fraunces text-2xl text-white italic">&quot;Un jour, on visitera ces deux villes ensemble.&quot;</p>
          <p className="font-caveat text-white/80 text-lg">— Papa 🧡</p>
        </div>

      </main>
    </>
  )
}
