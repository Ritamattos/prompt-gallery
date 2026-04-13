export const defaultData = {
  categories: [
    { id: 'c1', name: 'Relacionamento', icon: '💑' },
    { id: 'c2', name: 'Esporte', icon: '⚽' },
    { id: 'c3', name: 'Pet', icon: '🐾' },
    { id: 'c4', name: 'Criança', icon: '🧒' },
  ],
  subcategories: [
    { id: 's1', catId: 'c1', name: 'Arte de Casal' },
    { id: 's2', catId: 'c1', name: 'Foto Realista' },
    { id: 's3', catId: 'c2', name: 'Arte Personalizada' },
    { id: 's4', catId: 'c2', name: 'Foto Real de Esporte' },
    { id: 's5', catId: 'c3', name: 'Arte de Cachorro' },
    { id: 's6', catId: 'c4', name: 'Aniversário Infantil' },
  ],
  prompts: [
    {
      id: 'p1', catId: 'c1', subId: 's1', name: 'Casal Romântico', img: null,
      text: 'A romantic couple portrait, soft lighting, bokeh background, photorealistic, 8k, cinematic mood, warm tones, intimate pose',
    },
    {
      id: 'p2', catId: 'c1', subId: 's2', name: 'Foto Realista Casal', img: null,
      text: 'Ultra realistic couple photo, professional photography, natural light, shallow depth of field, Canon 5D, 85mm lens, golden hour',
    },
    {
      id: 'p3', catId: 'c2', subId: 's3', name: 'Arte Futebol', img: null,
      text: 'Dynamic soccer player action shot, vibrant colors, digital art style, detailed jersey, stadium background, motion blur, dramatic lighting',
    },
    {
      id: 'p4', catId: 'c3', subId: 's5', name: 'Arte de Cachorro', img: null,
      text: 'Adorable dog portrait, painterly style, soft pastel colors, detailed fur texture, warm background, pet photography aesthetic',
    },
  ],
}
