document.addEventListener("DOMContentLoaded", () => {
  // 초기 데이터
  let categories = [
    { id: "all", name: "전체"}
  ];
  
  let orders = [];
  let selectedCategory = "all";

  // DOM 요소들
  const categoryList    = document.getElementById("categoryList");
  const menuList        = document.getElementById("menuList");
  const orderList       = document.getElementById("orderList");

  const totalAmount     = document.getElementById("totalAmount");
  
  const categoryPopup   = document.getElementById("categoryPopup");
  const foodPopup       = document.getElementById("foodPopup");

  // 한국 지역에 맞게 단위 변경
  function formatNumber(num) {
    return num.toLocaleString("ko-KR");
  }
  // 무작위 ID 생성
  function makeRandomId () {
    const dateNowValue = Date.now();
    const randomNumber = parseInt(Math.random()*10000);
    return dateNowValue + randomNumber;
  }
  // popup의 display 스타일이 block
  function popupStyleDisplayBlock(popup){
    popup.style.display = "block";
  }
  // popup의 display 스타일이 none
  function popupStyleDisplayNone(popup){
    popup.style.display = "none";
  }

  //-------------------------------------------------------------------------------
  const API_BASE = 'http://localhost:8080';
  //-------------------------------------------------------------------------------
  // HTTP 요청(GET 제외)
  async function httpRequest(path, method, body){
    try{
      const res = await fetch(`${API_BASE}/${path}`,{
        method: `${method}`,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch(err) {
      console.log("POST 실패: ", err)
    }
  }
  // GET 요청
  async function getRequest(path){
    try{
      const res = await fetch(`${API_BASE}/${path}`);
      if(!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (err) {
      console.err("호출 실패: ", err);
    }
  }
  //-------------------------------------------------------------------------------
  // 주문 아이템 추가 함수
  async function addOrderItems(newOrderId){
    for (const order of orders) {
      console.log(order);
      const id = makeRandomId();
      const newOrderItem = {
        id,
        menuId: order.foodId,
        quantity: order.quantity,
        orderId: newOrderId
      }
      // 주문 아이템 POST 요청
      await httpRequest("orderItems", "POST", newOrderItem);
    }
  }

  //-------------------------------------------------------------------------------
  // 카테고리란 렌더링
  async function renderCategories() {
    categories = [
      { id: "all", name: "전체"}
    ];
    const catData = await getRequest("categories");
    for (const cd of catData) {
      categories.push(cd);
    }

    categoryList.innerHTML = "";
    for (const cat of categories) {
      const btn = document.createElement("button");
      btn.className = `category-btn ${cat.id === selectedCategory ? 'active' : ''}`;
      btn.textContent = cat.name;
      btn.onclick = async () => {
        selectedCategory = cat.id;
        // 모든 카테고리 버튼에서 active 클래스 제거
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        // 선택된 버튼에 active 클래스 추가
        btn.classList.add('active');
        await renderFoods();
      };
      categoryList.appendChild(btn);

      // 삭제 버튼 ('전체'가 아닌 경우에만)
      if (cat.id !== "all") {
        const delBtn = document.createElement("button");
        delBtn.className = "category-btn delete";
        delBtn.textContent = "삭제";
        delBtn.onclick = async () => {
          if (confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) {
            // 해당 카테고리의 음식들도 함께 삭제
            foods = foods.filter(f => f.categoryId !== cat.id);
            httpRequest("categories", "DELETE", cat.id);
            // 현재 선택된 카테고리가 삭제된 경우 전체로 변경
            if (selectedCategory === cat.id) {
              selectedCategory = "all";
            }
            // 카테고리란 렌더링
            await renderCategories();
            // 메뉴란 렌더링
            await renderFoods();
          }
        };
        categoryList.appendChild(delBtn);
      }
    }
  }

  // 음식 메뉴 렌더링
  async function renderFoods() {
    // 메뉴란 초기화
    foods = [];

    const menuData = await getRequest("menu");
    for (const md of menuData) {
      foods.push(md);
    }
    menuList.innerHTML = "";
    const filteredFoods = selectedCategory === "all" 
      ? foods 
      : foods.filter(f => f.categoryId === selectedCategory);
    
    if (filteredFoods.length === 0) {
      menuList.innerHTML = '<p class="no-items">해당 카테고리에 음식이 없습니다.</p>';
      return;
    }

    for (const food of filteredFoods) {
      const div = document.createElement("div");
      div.className = "food-item";
      div.innerHTML = `
        <h4>${food.name}</h4>
        <div class="price">${formatNumber(food.price)}원</div>
        <div class="description">
          ${food.description !== (undefined || null) ? food.description : ""}
        </div>
        <div class="actions">
          <button class="btn-order">주문</button>
          <button class="btn-delete">삭제</button>
        </div>
      `;
      
      // 주문 버튼 이벤트
      div.querySelector(".btn-order").onclick = () => updateOrderList(food.id);
      
      // 삭제 버튼 이벤트
      div.querySelector(".btn-delete").onclick = async () => {
        if (!confirm(`"${food.name}"을(를) 삭제하시겠습니까?`)) {
          return;
        }
        await httpRequest("menu", "DELETE", food.id);
        renderFoods();
      };
      
      menuList.appendChild(div);
    }
  }

  // 주문 추가
  function updateOrderList(foodId) {
    // orders에 해당 item이 있는지 확인
    const existingOrder = orders.find(o => o.foodId === foodId);
    // 있으면 quantity만 증가
    if (existingOrder) {
      existingOrder.quantity++;
    } else {
      // 없으면 orders에 해당 item 추가
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
      if(catop.value === selectedCategory.toString()){
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
    const id = makeRandomId();
    if (name) {
      newCategory = {
        id,
        name: name
      };
      await httpRequest("categories", "POST", newCategory);
      await renderCategories();
      popupStyleDisplayNone(categoryPopup);
    } else {
      alert("카테고리명을 입력해주세요.");
    }
  };

  // 메뉴 저장
  document.getElementById("saveFoodBtn").onclick = async () => {
    const name = document.getElementById("foodName").value.trim();
    const price = parseInt(document.getElementById("foodPrice").value) || 0;
    const description = document.getElementById("foodDesc").value.trim();
    const categoryId = document.getElementById("foodCategory").value;
    const id = makeRandomId();

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
      id,
      name,
      price,
      description,
      categoryId
    };
    
    await httpRequest("menu", "POST",newFood);

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

  //주문하기
  document.getElementById("orderBtn").onclick = async () => {
    if(!confirm("주문하시겠습니까?")){
      return;
    }
    const id = makeRandomId();
    const newOrder = {
      id,
      totalPrice: 0
    }
    // 주문 생성
    await httpRequest("orders", "POST", newOrder);
    // 주문 아이템 생성
    await addOrderItems(newOrder.id);
    // 주문 totalPrice 업데이트
    await httpRequest("orders", "PUT", newOrder.id);

    orders = [];
    renderOrders();
  }

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
