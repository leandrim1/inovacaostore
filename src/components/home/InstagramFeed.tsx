import { STORE } from "../../data/store";
import { Reveal } from "../ui/Reveal";
import { InstagramIcon } from "../ui/InstagramIcon";

import insta01 from "../../assets/images/insta-01.jpg";
import insta02 from "../../assets/images/insta-02.jpg";
import insta03 from "../../assets/images/insta-03.jpg";
import insta04 from "../../assets/images/insta-04.jpg";
import insta05 from "../../assets/images/insta-05.jpg";
import camiseta01 from "../../assets/images/product-camiseta-01.jpg";
import camiseta03 from "../../assets/images/product-camiseta-03.jpg";
import bermuda02 from "../../assets/images/product-bermuda-02.jpg";

const IMAGES = [
  insta01,
  camiseta01,
  insta02,
  insta03,
  bermuda02,
  insta04,
  camiseta03,
  insta05,
];

export function InstagramFeed() {
  return (
    <section className="bg-brand-cream py-16 sm:py-24">
      <div className="container-page">
        <Reveal>
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-ink text-white">
              <InstagramIcon size={20} />
            </span>
            <h2 className="section-title">Siga no Instagram</h2>
            <a
              href={STORE.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="font-display text-sm tracking-widest text-brand-yellow-dark hover:underline"
            >
              {STORE.social.instagramHandle}
            </a>
          </div>
        </Reveal>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-8">
          {IMAGES.map((src, i) => (
            <Reveal key={i} delay={(i % 8) * 0.03}>
              <a
                href={STORE.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-lg"
              >
                <img
                  src={src}
                  alt="Publicação da Inovação Store no Instagram"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                  <InstagramIcon
                    size={22}
                    className="text-white opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
