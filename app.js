document.addEventListener("DOMContentLoaded", () => {
  // 초기 데이터
  let categories = [
    { id: "all", name: "전체"}
  ];
  
  let foods = [
    { id: 1, name: "비빔밥",  price: 12000, desc: "육회 들어감",  categoryId: 1 },
    { id: 2, name: "피자",    price: 22000, desc: "치즈 폭탄",    categoryId: 2 },
    { id: 3, name: "초밥",    price: 18000, desc: "모둠초밥",     categoryId: 3 }
  ];
  
  let orders = [];
  let selectedCategory = "all";
  let dateNowValue = "";
  let data = [];


  // DOM 요소들
  const categoryList    = document.getElementById("categoryList");
  const menuList        = document.getElementById("menuList");
  const orderList       = document.getElementById("orderList");

  const totalAmount     = document.getElementById("totalAmount");
  
  const categoryPopup   = document.getElementById("categoryPopup");
  const foodPopup       = document.getElementById("foodPopup");


  function formatNumber(num) {
    return num.toLocaleString("ko-KR");
  }
  function dateNow () {
    dateNowValue = Date.now();
  }
  function popupStyleDisplayBlock(popup){
    popup.style.display = "block";
  }
  function popupStyleDisplayNone(popup){
    popup.style.display = "none";
  }

  const API_BASE = 'http://localhost:8080';

  // GET 요청
  async function loadCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      data = await res.json();
      console.log("카테고리 목록:", data);
    } catch (err) {
      console.error("호출 실패:", err);
    }
  }

  // POST 요청
  async function addCategory(addedData) {
    console.log(addedData);
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(addedData)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      console.log("생성된 카테고리:", data);
    } catch (err) {
      console.error("POST 실패:", err);
    }
  }

  // DELETE 요청
  async function deleteCategory(id) {
    console.log(id);
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(id)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      console.log("생성된 카테고리:", data);
    } catch (err) {
      console.error("POST 실패:", err);
    }
  }

  // 카테고리 렌더링
  async function renderCategories() {
    categories = [
      { id: "all", name: "전체"}
    ];

    await loadCategories();
    data.forEach(d => {
      categories.push(d);
    });

    categoryList.innerHTML = "";
    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = `category-btn ${cat.id === selectedCategory ? 'active' : ''}`;
      btn.textContent = cat.name;
      btn.onclick = () => {
        selectedCategory = cat.id;
        // 모든 카테고리 버튼에서 active 클래스 제거
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        // 선택된 버튼에 active 클래스 추가
        btn.classList.add('active');
        renderFoods();
      };
      categoryList.appendChild(btn);

      // 삭제 버튼 (내장 카테고리가 아닌 경우에만)
      if (cat.id !== "all") {
        const delBtn = document.createElement("button");
        delBtn.className = "category-btn delete";
        delBtn.textContent = "삭제";
        delBtn.onclick = () => {
          if (confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) {
            // 해당 카테고리의 음식들도 함께 삭제
            foods = foods.filter(f => f.categoryId !== cat.id);
            deleteCategory(cat.id);
            
            // 현재 선택된 카테고리가 삭제된 경우 전체로 변경
            if (selectedCategory === cat.id) {
              selectedCategory = "all";
            }
            
            renderCategories();
            renderFoods();
          }
        };
        categoryList.appendChild(delBtn);
      }
    });
  }

  // 음식 메뉴 렌더링
  function renderFoods() {
    menuList.innerHTML = "";
    const filteredFoods = selectedCategory === "all" 
      ? foods 
      : foods.filter(f => f.categoryId === selectedCategory);
    
    if (filteredFoods.length === 0) {
      menuList.innerHTML = '<p class="no-items">해당 카테고리에 음식이 없습니다.</p>';
      return;
    }

    filteredFoods.forEach(food => {
      const div = document.createElement("div");
      div.className = "food-item";
      div.innerHTML = `
        <h4>${food.name}</h4>
        <div class="price">${formatNumber(food.price)}원</div>
        <div class="description">${food.desc}</div>
        <div class="actions">
          <button class="btn-order">주문</button>
          <button class="btn-delete">삭제</button>
        </div>
      `;
      
      // 주문 버튼 이벤트
      div.querySelector(".btn-order").onclick = () => addOrder(food.id);
      
      // 삭제 버튼 이벤트
      div.querySelector(".btn-delete").onclick = () => {
        if (confirm(`"${food.name}"을(를) 삭제하시겠습니까?`)) {
          foods = foods.filter(f => f.id !== food.id);
          renderFoods();
        }
      };
      
      menuList.appendChild(div);
    });
  }

  // 주문 추가
  function addOrder(foodId) {
    const existingOrder = orders.find(o => o.foodId === foodId);
    
    if (existingOrder) {
      existingOrder.quantity++;
    } else {
      orders.push({ 
        foodId, 
        quantity: 1 
      });
    }
    
    renderOrders();
  }

  // 주문 목록 렌더링
  function renderOrders() {
    orderList.innerHTML = "";
    let total = 0;
    
    
    if (orders.length === 0) {
      orderList.innerHTML = '<p class="no-items">주문한 음식이 없습니다.</p>';
      totalAmount.textContent = "0";
      return;
    }

    orders.forEach(order => {
      const food = foods.find(f => f.id === order.foodId);
      if (!food) return;
      
      const orderItem = document.createElement("div");
      orderItem.className = "order-item";
      orderItem.innerHTML = `
        <div class="food-info">
          <div class="food-name">${food.name}</div>
          <div class="food-price">${formatNumber(food.price)}원</div>
        </div>
        <div class="quantity-controls">
          <button class="quantity-btn minus">-</button>
          <input type="number" class="quantity-input" value="${order.quantity}" min="1" max="99">
          <button class="quantity-btn plus">+</button>
        </div>
      `;

      total += food.price * order.quantity;
      totalAmount.textContent = formatNumber(total);
      orderList.appendChild(orderItem);

      // --------- 주문 수량, 합계란 ---------------
      const quantityInput = orderItem.querySelector(".quantity-input");
      const minusBtn = orderItem.querySelector(".minus");
      const plusBtn = orderItem.querySelector(".plus");
      
      // 수량 변경 이벤트
      quantityInput.onchange = (e) => {
        const newQuantity = parseInt(e.target.value) || 1;
        if (newQuantity < 1) {
          e.target.value = 1;
          order.quantity = 1;
        } else {
          order.quantity = newQuantity;
        }
        renderTotalPrice();
      };
      
      // 마이너스 버튼
      minusBtn.onclick = () => {
        if (order.quantity > 1) {
          order.quantity--;
          quantityInput.value = order.quantity;
          renderTotalPrice();
        }
      };
      
      // 플러스 버튼
      plusBtn.onclick = () => {
        if (order.quantity < 99) {
          order.quantity++;
          quantityInput.value = order.quantity;
          renderTotalPrice();
        }
      };      
    });
  }

  function renderTotalPrice(){
    let total = 0;
    orders.forEach(order => {
      const food = foods.find(f => f.id === order.foodId);
      total += food.price * order.quantity;
      totalAmount.textContent = formatNumber(total);
    });
  }

  // 카테고리 추가 팝업
  document.getElementById("addCategoryBtn").onclick = () => {
    document.getElementById("categoryName").value = "";
    popupStyleDisplayBlock(categoryPopup);
  };

  // 메뉴 추가 팝업
  document.getElementById("addFoodBtn").onclick = () => {
    const select = document.getElementById("foodCategory");
    select.innerHTML = '<option value="">카테고리를 선택하시오.</option>';
    
    // 내장 카테고리가 아닌 것들만 표시
    categories.filter(c => c.id !== "all")
      .forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        option.className = "categoryOption";
        select.appendChild(option);
      });
    
    const categoryOptions = document.querySelectorAll(".categoryOption");
    categoryOptions.forEach(catop => {
      if(catop.value === selectedCategory){
        document.querySelector("#foodCategory").value = catop.value;
      }
    });
    
    document.getElementById("foodName").value = "";
    document.getElementById("foodPrice").value = "";
    document.getElementById("foodDesc").value = "";
    popupStyleDisplayBlock(foodPopup);
  };

  // 카테고리 저장
  document.getElementById("saveCategoryBtn").onclick = async () => {
    const name = document.getElementById("categoryName").value.trim();
    dateNow();
    if (name) {
      newCategory = {
        id: dateNowValue,
        name: name
      };
      console.log(newCategory.id);
      await addCategory(newCategory);
      await renderCategories();
      popupStyleDisplayNone(categoryPopup);
    } else {
      alert("카테고리명을 입력해주세요.");
    }
  };

  // 메뉴 저장
  document.getElementById("saveFoodBtn").onclick = () => {
    const name = document.getElementById("foodName").value.trim();
    const price = parseInt(document.getElementById("foodPrice").value) || 0;
    const desc = document.getElementById("foodDesc").value.trim();
    const categoryId = document.getElementById("foodCategory").value;
    dateNow();

    if (!name) {
      alert("음식명을 입력해주세요.");
      return;
    }
    
    if (!categoryId) {
      alert("카테고리를 선택해주세요.");
      return;
    }
    
    if (price <= 0) {
      alert("올바른 가격을 입력해주세요.");
      return;
    }
    
    const newFood = {
      id: dateNowValue,
      name: name,
      price: price,
      desc: desc,
      categoryId: categoryId
    };
    
    foods.push(newFood);

    renderFoods();
    popupStyleDisplayNone(foodPopup);
  };

  // 팝업 닫기
  document.querySelectorAll(".closePopup").forEach(btn => {
    btn.onclick = () => {
      btn.closest(".popup").style.display = "none";
    };
  });

  // 팝업 외부 클릭 시 닫기
  document.querySelectorAll(".popup").forEach(popup => {
    popup.onclick = (e) => {
      if (e.target === popup) {
        popupStyleDisplayNone(popup);
      }
    };
  });

  // 주문 초기화
  document.getElementById("resetOrderBtn").onclick = () => {
    if (orders.length > 0 && confirm("주문을 초기화하시겠습니까?")) {
      orders = [];
      renderOrders();
    }
  };

  // ESC 키로 팝업 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".popup").forEach(popup => {
        popupStyleDisplayNone(popup);
      });
    }
  });

  // 초기 렌더링
  renderCategories();
  renderFoods();
  renderOrders();
});
