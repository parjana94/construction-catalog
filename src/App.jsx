import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabase = createClient(
  "https://xtqcmlkjzfdsswbsxlyh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWNtbGtqemZkc3N3YnN4bHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Mjc2MTYsImV4cCI6MjA5NjMwMzYxNn0.UlFINDGIstKOEHktKXxkYSpSyhJNsUupfrDbijGrT04"
);

const EMOJI_MAP = {
  კლიფსი: "🔩", ვედრო: "🪣", შვენელა: "🪣",
  სამაგრი: "⚙️", ამწე: "🔧", "U-ტიპის": "🔩",
};

function getEmoji(name) {
  for (const key in EMOJI_MAP) if (name.includes(key)) return EMOJI_MAP[key];
  return "🔧";
}

const EMPTY_FORM = { name: "", price: "", img: "", desc: "", phone: "" };

export default function App() {
  const [tab, setTab] = useState("catalog");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveMsg, setSaveMsg] = useState("");
  const [modalImg, setModalImg] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setProducts(data);
    setLoading(false);
  }

  async function deleteProduct(id) {
    if (!window.confirm("პროდუქტი წაიშლება. დარწმუნებული ხარ?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter((p) => p.id !== id));
    if (editingId === id) { setEditingId(null); setForm(EMPTY_FORM); }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ name: p.name, price: String(p.price), img: p.img || "", desc: p.description || "", phone: p.phone || "" });
    setErrors({});
    document.querySelector(".add-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: false }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = true;
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) errs.price = true;
    return errs;
  }

  async function saveProduct() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      name: form.name.trim(),
      price: parseFloat(parseFloat(form.price).toFixed(2)),
      img: form.img.trim(),
      description: form.desc.trim(),
      phone: form.phone.trim(),
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (!error) {
        setProducts(products.map((p) => p.id === editingId ? data : p));
        setSaveMsg("✓ განახლდა!");
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
      if (!error) {
        setProducts([...products, data]);
        setSaveMsg("✓ დამატებულია!");
      }
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrors({});
    setTimeout(() => setSaveMsg(""), 2000);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-icon">🏗️</div>
        <div>
          <h1 className="header-title">სამშენებლო კატალოგი</h1>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${tab === "catalog" ? "active" : ""}`} onClick={() => setTab("catalog")}>
          კატალოგი <span className="badge">{products.length}</span>
        </button>
        {/* <button className={`tab ${tab === "admin" ? "active" : ""}`} onClick={() => setTab("admin")}>
          ადმინი
        </button> */}
      </div>

      {/* ── CATALOG ── */}
      {tab === "catalog" && (
        <div>
          <p className="section-label">ყველა პროდუქტი</p>
          {loading ? (
            <div className="empty">იტვირთება...</div>
          ) : products.length === 0 ? (
            <div className="empty">პროდუქტები არ არის დამატებული</div>
          ) : (
            <div className="catalog-grid">
              {products.map((p) => (
                <div className="prod-card" key={p.id}>
                  <div className="prod-img" onClick={() => p.img && setModalImg(p.img)} style={p.img ? {cursor:"zoom-in"} : {}}>
                    {p.img ? <img src={p.img} alt={p.name} /> : <span className="prod-emoji">{getEmoji(p.name)}</span>}
                  </div>
                  <div className="prod-body">
                    <div className="prod-price">₾{parseFloat(p.price).toFixed(2)}</div>
                    <div className="prod-name">{p.name}</div>
                    <div className="prod-desc">{p.description || "—"}</div>
                  </div>
                  <div className="prod-footer">
                    {p.phone ? (
                      <a className="btn-contact" href={`tel:${p.phone}`}>📞 დაკავშირება</a>
                    ) : (
                      <a className="btn-contact btn-contact--whatsapp" href="https://wa.me/" target="_blank" rel="noreferrer">💬 დაკავშირება</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADMIN ── */}
      {tab === "admin" && (
        <div className="admin-panel">
          <p className="section-label">პროდუქტები ({products.length})</p>

          <div className="admin-list">
            {products.length === 0 ? (
              <div className="empty">სია ცარიელია</div>
            ) : (
              products.map((p) => (
                <div className={`admin-item ${editingId === p.id ? "admin-item--editing" : ""}`} key={p.id}>
                  <div className="admin-item-img">
                    {p.img ? <img src={p.img} alt={p.name} /> : getEmoji(p.name)}
                  </div>
                  <div className="admin-item-info">
                    <div className="admin-item-name">{p.name}</div>
                    <div className="admin-item-price">₾{parseFloat(p.price).toFixed(2)}</div>
                  </div>
                  <div className="admin-item-actions">
                    <button className="btn-edit" onClick={() => editingId === p.id ? cancelEdit() : startEdit(p)} aria-label="რედაქტირება">
                      {editingId === p.id ? "✕" : "✏️"}
                    </button>
                    <button className="btn-del" onClick={() => deleteProduct(p.id)} aria-label="წაშლა">🗑</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="add-form">
            <p className="form-title">{editingId ? "პროდუქტის რედაქტირება" : "ახალი პროდუქტი"}</p>
            <div className="form-grid">
              <div className="form-group">
                <label>სახელი *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="მაგ. M8 კლიფსი" className={errors.name ? "error" : ""} />
              </div>
              <div className="form-group">
                <label>ფასი (₾) *</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="0.00" step="0.01" min="0" className={errors.price ? "error" : ""} />
              </div>
              <div className="form-group full">
                <label>სურათის URL</label>
                <input name="img" value={form.img} onChange={handleChange} placeholder="https://..." />
              </div>
              <div className="form-group full">
                <label>კონტაქტის ნომერი</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+995 5XX XXX XXX" />
              </div>
              <div className="form-group full">
                <label>აღწერა</label>
                <textarea name="desc" value={form.desc} onChange={handleChange} placeholder="პროდუქტის მოკლე აღწერა..." />
              </div>
            </div>
            <div className="form-footer">
              <button className="btn-save" onClick={saveProduct}>{editingId ? "განახლება" : "შენახვა"}</button>
              {editingId && <button className="btn-cancel" onClick={cancelEdit}>გაუქმება</button>}
              {saveMsg && <span className="save-msg">{saveMsg}</span>}
            </div>
          </div>
        </div>
      )}
      {modalImg && createPortal(
        <div className="modal-overlay" onClick={() => setModalImg(null)}>
          <img src={modalImg} alt="სურათი" className="modal-img" />
        </div>,
        document.body
      )}
    </div>
  );
}
